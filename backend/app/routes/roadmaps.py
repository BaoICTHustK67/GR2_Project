"""
Roadmap Routes
"""
import os
import json
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import google.generativeai as genai

from app import db
from app.models import User, RoadmapTemplate, UserRoadmap, Education, Experience, Skill, Project

bp = Blueprint('roadmaps', __name__, url_prefix='/api/roadmaps')


def clean_json(text):
    """Clean JSON response from AI by removing markdown code blocks"""
    text = text.strip()
    if text.startswith('```json'):
        text = text[7:]
    elif text.startswith('```'):
        text = text[3:]
    if text.endswith('```'):
        text = text[:-3]
    return text.strip()


# ========== Predefined Templates ==========

@bp.route('/templates', methods=['GET'])
def get_templates():
    """Get all active predefined roadmap templates"""
    try:
        templates = RoadmapTemplate.query.filter_by(is_active=True).all()
        return jsonify({
            'success': True,
            'templates': [t.to_dict() for t in templates]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/templates/<int:template_id>', methods=['GET'])
def get_template(template_id):
    """Get a specific roadmap template"""
    try:
        template = RoadmapTemplate.query.get(template_id)
        if not template:
            return jsonify({'success': False, 'message': 'Template not found'}), 404
        return jsonify({
            'success': True,
            'template': template.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ========== AI Generation ==========

@bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_roadmap():
    """Generate an AI-powered personalized roadmap"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        data = request.get_json()
        target_role = data.get('targetRole', '')
        target_level = data.get('targetLevel', 'Mid')
        use_profile = data.get('useProfile', True)
        additional_context = data.get('additionalContext', '')

        if not target_role:
            return jsonify({'success': False, 'message': 'Target role is required'}), 400

        # Build user profile context if requested
        profile_context = ""
        if use_profile:
            # Get user's current skills
            skills = Skill.query.filter_by(user_id=user_id).all()
            skill_names = [s.name for s in skills]
            
            # Get education
            educations = Education.query.filter_by(user_id=user_id).all()
            edu_info = [f"{e.degree} in {e.field_of_study} from {e.school}" for e in educations if e.school]
            
            # Get experience
            experiences = Experience.query.filter_by(user_id=user_id).all()
            exp_info = [f"{e.title} at {e.company}" for e in experiences if e.title and e.company]
            
            profile_context = f"""
CURRENT USER PROFILE:
- Skills: {', '.join(skill_names) if skill_names else 'None listed'}
- Education: {'; '.join(edu_info) if edu_info else 'None listed'}
- Experience: {'; '.join(exp_info) if exp_info else 'None listed'}
- Bio: {user.bio or 'Not provided'}
"""

        # Configure Gemini
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return jsonify({'success': False, 'error': 'Gemini API key not configured'}), 500
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        prompt = f"""
Generate a comprehensive career roadmap for someone who wants to become a {target_level} {target_role}.
{profile_context}
{f"Additional context from user: {additional_context}" if additional_context else ""}

Return a JSON object with the following structure:
{{
    "title": "Roadmap to {target_level} {target_role}",
    "description": "A brief description of this roadmap",
    "estimatedDuration": "X-Y months",
    "steps": [
        {{
            "id": "step-1",
            "title": "Step title",
            "description": "Detailed description of what to learn/do",
            "duration": "X-Y weeks",
            "skills": ["skill1", "skill2"],
            "resources": [
                {{"title": "Resource name", "url": "https://..."}}
            ],
            "completed": false
        }}
    ],
    "skillsCovered": ["skill1", "skill2", "skill3"]
}}

RULES:
1. Create 5-8 progressive steps that build on each other
2. Each step should take 2-6 weeks
3. Include relevant, real learning resources (courses, docs, tutorials)
4. If user profile is provided, acknowledge their existing skills and skip basics they already know
5. Return ONLY valid JSON, no markdown formatting
"""

        try:
            response = model.generate_content(prompt)
            raw_text = response.text
            roadmap_data = json.loads(clean_json(raw_text))
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return jsonify({'success': False, 'error': 'Failed to generate roadmap with AI'}), 500

        return jsonify({
            'success': True,
            'roadmap': roadmap_data
        }), 200

    except Exception as e:
        print(f"Generate Roadmap Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ========== User Roadmaps ==========

@bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_roadmaps():
    """Get current user's saved roadmaps"""
    try:
        user_id = int(get_jwt_identity())
        roadmaps = UserRoadmap.query.filter_by(user_id=user_id).order_by(UserRoadmap.updated_at.desc()).all()
        return jsonify({
            'success': True,
            'roadmaps': [r.to_dict() for r in roadmaps]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/save', methods=['POST'])
@jwt_required()
def save_roadmap():
    """Save a roadmap (from template or AI-generated)"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()

        title = data.get('title')
        if not title:
            return jsonify({'success': False, 'message': 'Title is required'}), 400

        roadmap = UserRoadmap(
            user_id=user_id,
            template_id=data.get('templateId'),
            title=title,
            target_role=data.get('targetRole'),
            target_level=data.get('targetLevel'),
            steps=data.get('steps', []),
            progress=0,
            is_ai_generated=data.get('isAiGenerated', False)
        )
        
        db.session.add(roadmap)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Roadmap saved successfully',
            'roadmap': roadmap.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/<int:roadmap_id>/progress', methods=['PUT'])
@jwt_required()
def update_progress(roadmap_id):
    """Update progress on a roadmap (mark steps complete)"""
    try:
        user_id = int(get_jwt_identity())
        roadmap = UserRoadmap.query.filter_by(id=roadmap_id, user_id=user_id).first()
        
        if not roadmap:
            return jsonify({'success': False, 'message': 'Roadmap not found'}), 404

        data = request.get_json()
        
        # Update steps if provided
        if 'steps' in data:
            roadmap.steps = data['steps']
        
        # Calculate progress based on completed steps
        steps = roadmap.steps or []
        if steps:
            completed = sum(1 for step in steps if step.get('completed', False))
            roadmap.progress = int((completed / len(steps)) * 100)
        
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Progress updated',
            'roadmap': roadmap.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/<int:roadmap_id>', methods=['DELETE'])
@jwt_required()
def delete_roadmap(roadmap_id):
    """Delete a user's roadmap"""
    try:
        user_id = int(get_jwt_identity())
        roadmap = UserRoadmap.query.filter_by(id=roadmap_id, user_id=user_id).first()
        
        if not roadmap:
            return jsonify({'success': False, 'message': 'Roadmap not found'}), 404

        db.session.delete(roadmap)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Roadmap deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
