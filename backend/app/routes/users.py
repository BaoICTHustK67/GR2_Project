"""
User Routes
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Education, Experience, Skill, Project
import google.generativeai as genai
import os
import json
from datetime import datetime

bp = Blueprint('users', __name__, url_prefix='/api/users')


def parse_date(date_str):
    """Parse ISO date string to datetime.date object"""
    if not date_str:
        return None
    try:
        # Front-end sends ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)
        if 'T' in date_str:
            return datetime.strptime(date_str.split('T')[0], '%Y-%m-%d').date()
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_my_profile():
    """Get current user's profile"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    # Get connection count
    from app.models import user_connections
    from sqlalchemy import or_
    
    connections_count = db.session.query(user_connections).filter(
        or_(
            user_connections.c.user_id == user_id,
            user_connections.c.connected_user_id == user_id
        ),
        user_connections.c.status == 'accepted'
    ).count()
    
    user_data = user.to_dict()
    user_data['connectionsCount'] = connections_count

    return jsonify({
        'success': True,
        'user': user_data
    })


@bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users with optional filtering"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    
    query = User.query.filter(User.status == 'active')
    
    if search:
        query = query.filter(
            (User.name.ilike(f'%{search}%')) |
            (User.email.ilike(f'%{search}%'))
        )
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'users': [user.to_dict() for user in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'currentPage': page
    })


@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get a specific user by ID"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    # Check connection status
    from app.models import user_connections
    from sqlalchemy import and_, or_
    
    connection = db.session.query(user_connections).filter(
        or_(
            and_(
                user_connections.c.user_id == current_user_id,
                user_connections.c.connected_user_id == user_id
            ),
            and_(
                user_connections.c.user_id == user_id,
                user_connections.c.connected_user_id == current_user_id
            )
        )
    ).first()
    
    status = 'none'
    is_requester = False
    
    if connection:
        status = connection.status
        if connection.user_id == current_user_id:
            is_requester = True
            
    # Get connection count
    connections_count = db.session.query(user_connections).filter(
        or_(
            user_connections.c.user_id == user_id,
            user_connections.c.connected_user_id == user_id
        ),
        user_connections.c.status == 'accepted'
    ).count()
            
    response_data = user.to_dict()
    response_data['connectionStatus'] = status
    response_data['isRequester'] = is_requester
    response_data['connectionsCount'] = connections_count
    
    return jsonify({
        'success': True,
        'user': response_data
    })


@bp.route('/<int:user_id>/education', methods=['GET'])
@jwt_required()
def get_user_education(user_id):
    """Get user's education"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    return jsonify({
        'success': True,
        'education': [edu.to_dict() for edu in user.educations]
    })


@bp.route('/education', methods=['POST'])
@jwt_required()
def add_education():
    """Add education to current user"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    education = Education(
        user_id=user_id,
        school=data.get('school'),
        degree=data.get('degree'),
        field_of_study=data.get('fieldOfStudy'),
        start_date=parse_date(data.get('startDate')),
        end_date=parse_date(data.get('endDate')),
        description=data.get('description')
    )
    
    try:
        db.session.add(education)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Education added',
            'education': education.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to add education'
        }), 500


@bp.route('/education/<int:edu_id>', methods=['PUT'])
@jwt_required()
def update_education(edu_id):
    """Update education"""
    user_id = int(get_jwt_identity())
    education = Education.query.filter_by(id=edu_id, user_id=user_id).first()
    
    if not education:
        return jsonify({
            'success': False,
            'message': 'Education not found'
        }), 404
    
    data = request.get_json()
    
    if 'school' in data:
        education.school = data['school']
    if 'degree' in data:
        education.degree = data['degree']
    if 'fieldOfStudy' in data:
        education.field_of_study = data['fieldOfStudy']
    if 'startDate' in data:
        education.start_date = parse_date(data['startDate'])
    if 'endDate' in data:
        education.end_date = parse_date(data['endDate'])
    if 'description' in data:
        education.description = data['description']
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Education updated',
            'education': education.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update education'
        }), 500


@bp.route('/education/<int:edu_id>', methods=['DELETE'])
@jwt_required()
def delete_education(edu_id):
    """Delete education"""
    user_id = int(get_jwt_identity())
    education = Education.query.filter_by(id=edu_id, user_id=user_id).first()
    
    if not education:
        return jsonify({
            'success': False,
            'message': 'Education not found'
        }), 404
    
    try:
        db.session.delete(education)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Education deleted'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete education'
        }), 500


@bp.route('/<int:user_id>/experience', methods=['GET'])
@jwt_required()
def get_user_experience(user_id):
    """Get user's experience"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    return jsonify({
        'success': True,
        'experience': [exp.to_dict() for exp in user.experiences]
    })


@bp.route('/experience', methods=['POST'])
@jwt_required()
def add_experience():
    """Add experience to current user"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    experience = Experience(
        user_id=user_id,
        title=data.get('title'),
        company=data.get('company'),
        location=data.get('location'),
        start_date=parse_date(data.get('startDate')),
        end_date=parse_date(data.get('endDate')),
        is_current=data.get('isCurrent', False),
        description=data.get('description')
    )
    
    try:
        db.session.add(experience)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Experience added',
            'experience': experience.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to add experience'
        }), 500


@bp.route('/experience/<int:exp_id>', methods=['PUT'])
@jwt_required()
def update_experience(exp_id):
    """Update experience"""
    user_id = int(get_jwt_identity())
    experience = Experience.query.filter_by(id=exp_id, user_id=user_id).first()
    
    if not experience:
        return jsonify({
            'success': False,
            'message': 'Experience not found'
        }), 404
    
    data = request.get_json()
    
    if 'title' in data:
        experience.title = data['title']
    if 'company' in data:
        experience.company = data['company']
    if 'location' in data:
        experience.location = data['location']
    if 'startDate' in data:
        experience.start_date = parse_date(data['startDate'])
    if 'endDate' in data:
        experience.end_date = parse_date(data['endDate'])
    if 'isCurrent' in data:
        experience.is_current = data['isCurrent']
    if 'description' in data:
        experience.description = data['description']
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Experience updated',
            'experience': experience.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update experience'
        }), 500


@bp.route('/experience/<int:exp_id>', methods=['DELETE'])
@jwt_required()
def delete_experience(exp_id):
    """Delete experience"""
    user_id = int(get_jwt_identity())
    experience = Experience.query.filter_by(id=exp_id, user_id=user_id).first()
    
    if not experience:
        return jsonify({
            'success': False,
            'message': 'Experience not found'
        }), 404
    
    try:
        db.session.delete(experience)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Experience deleted'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete experience'
        }), 500


@bp.route('/<int:user_id>/skills', methods=['GET'])
@jwt_required()
def get_user_skills(user_id):
    """Get user's skills"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    return jsonify({
        'success': True,
        'skills': [skill.to_dict() for skill in user.skills]
    })


@bp.route('/skills', methods=['POST'])
@jwt_required()
def add_skill():
    """Add skill to current user"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    skill = Skill(
        user_id=user_id,
        name=data.get('name'),
        level=data.get('level')
    )
    
    try:
        db.session.add(skill)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Skill added',
            'skill': skill.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to add skill'
        }), 500


@bp.route('/skills/<int:skill_id>', methods=['DELETE'])
@jwt_required()
def delete_skill(skill_id):
    """Delete skill"""
    user_id = int(get_jwt_identity())
    skill = Skill.query.filter_by(id=skill_id, user_id=user_id).first()
    
    if not skill:
        return jsonify({
            'success': False,
            'message': 'Skill not found'
        }), 404
    
    try:
        db.session.delete(skill)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Skill deleted'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete skill'
        }), 500


@bp.route('/<int:user_id>/projects', methods=['GET'])
@jwt_required()
def get_user_projects(user_id):
    """Get user's projects"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    return jsonify({
        'success': True,
        'projects': [project.to_dict() for project in user.projects]
    })


@bp.route('/projects', methods=['POST'])
@jwt_required()
def add_project():
    """Add project to current user"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    project = Project(
        user_id=user_id,
        name=data.get('name'),
        description=data.get('description'),
        url=data.get('url'),
        technologies=data.get('technologies', []),
        start_date=parse_date(data.get('startDate')),
        end_date=parse_date(data.get('endDate'))
    )
    
    try:
        db.session.add(project)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Project added',
            'project': project.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to add project'
        }), 500


@bp.route('/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    """Update project"""
    user_id = int(get_jwt_identity())
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    
    if not project:
        return jsonify({
            'success': False,
            'message': 'Project not found'
        }), 404
    
    data = request.get_json()
    
    if 'name' in data:
        project.name = data['name']
    if 'description' in data:
        project.description = data['description']
    if 'url' in data:
        project.url = data['url']
    if 'technologies' in data:
        project.technologies = data['technologies']
    if 'startDate' in data:
        project.start_date = parse_date(data['startDate'])
    if 'endDate' in data:
        project.end_date = parse_date(data['endDate'])
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Project updated',
            'project': project.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update project'
        }), 500


@bp.route('/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    """Delete project"""
    user_id = int(get_jwt_identity())
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    
    if not project:
        return jsonify({
            'success': False,
            'message': 'Project not found'
        }), 404
    
    try:
        db.session.delete(project)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Project deleted'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete project'
        }), 500


@bp.route('/suggestions', methods=['GET'])
@jwt_required()
def get_suggested_connections():
    """Get suggested connections for current user"""
    user_id = int(get_jwt_identity())
    limit = request.args.get('limit', 5, type=int)
    
    # Get users that are not the current user
    users = User.query.filter(
        User.id != user_id,
        User.status == 'active'
    ).limit(limit).all()
    
    return jsonify({
        'success': True,
        'suggestions': [user.to_dict() for user in users]
    })

def clean_json(text):
    if not text:
        return "{}"
    clean = text.replace('```json', '').replace('```', '')
    return clean.strip()

@bp.route('/enhance-profile', methods=['POST'])
@jwt_required()
def enhance_profile():
    """Enhance profile section using AI"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
        data = request.get_json()
        section = data.get('section')  # 'headline', 'about', 'experience'
        content = data.get('content')
        
        if not section or not content:
            return jsonify({'success': False, 'message': 'Section and content are required'}), 400
            
        # Configure Gemini
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
             return jsonify({'success': False, 'error': 'Server configuration error: Gemini API Key missing'}), 500
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompts = {
            'headline': f"Rewrite the following professional headline to be more catchy and impactful for a LinkedIn-style profile. Keep it concise. Current headline: {content}",
            'about': f"Enhance the following 'About' or 'Bio' section for a professional profile. Make it engaging, highlight key strengths, and keep a professional tone. Current content: {content}",
            'experience': f"Improve the following job experience description to be more achievement-oriented and professional. Use action verbs and focus on impact. Current description: {content}",
            'education': f"Refine the following education description to highlight relevant coursework, honors, or activities in a professional manner. Current description: {content}",
            'project': f"Enhance the following project description to clearly articulate the problem, your solution, and the technologies used. Focus on impact and technical complexity. Current description: {content}"
        }
        
        prompt = prompts.get(section)
        if not prompt:
            return jsonify({'success': False, 'message': 'Invalid section'}), 400

        try:
            response = model.generate_content(prompt)
            suggested_text = response.text.strip()
            # Clean up potential markdown formatting if Gemini adds it
            if suggested_text.startswith('"') and suggested_text.endswith('"'):
                suggested_text = suggested_text[1:-1]
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return jsonify({'success': False, 'error': 'Failed to generate suggestion using AI'}), 500
            
        return jsonify({
            'success': True,
            'suggestion': suggested_text
        }), 200
        
    except Exception as e:
        print(f"Profile Enhancement Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/scan-profile', methods=['POST'])
@jwt_required()
def scan_profile():
    """Scan user profile and provide AI feedback"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
        data = request.get_json()
        target_role = data.get('role')
        target_level = data.get('level')
        
        if not target_role or not target_level:
            return jsonify({'success': False, 'message': 'Role and level are required'}), 400
            
        # Collect profile information
        experience = [exp.to_dict() for exp in user.experiences]
        education = [edu.to_dict() for edu in user.educations]
        skills = [skill.to_dict() for skill in user.skills]
        projects = [proj.to_dict() for proj in user.projects]
        
        # Validation: check if at least one field has data
        if not any([experience, education, skills, projects]):
            return jsonify({
                'success': False, 
                'message': 'Please set up at least one of these fields: Experience, Education, Skills, or Projects to scan your profile.'
            }), 400
            
        # Configure Gemini
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
             return jsonify({'success': False, 'error': 'Server configuration error: Gemini API Key missing'}), 500
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Prepare content for AI analysis
        profile_data = {
            'name': user.name,
            'headline': user.headline,
            'bio': user.bio,
            'experience': experience,
            'education': education,
            'skills': skills,
            'projects': projects
        }
        
        prompt = f"""Analyze the following user profile and provide feedback for the target role of "{target_role}" at "{target_level}" level.
            
            PROFILE DATA:
            {json.dumps(profile_data, indent=2)}
            
            Provide a detailed evaluation in JSON format with the following structure:
            {{
                "matchingScore": <number 0-100 indicating how well they match the target role/level>,
                "feedback": "<overall summary of the profile suitability>",
                "strengths": [<list of strings highlighting key relevant strengths>],
                "gaps": [<list of strings identifying missing skills or experience>],
                "recommendations": [<list of strings with actionable advice to improve matching>]
            }}
            
            CRITICAL INSTRUCTION: Return ONLY raw JSON. Do not use Markdown formatting. Do not wrap in ```.
        """
        
        try:
            response = model.generate_content(prompt)
            raw_text = response.text
            scan_results = json.loads(clean_json(raw_text))
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return jsonify({'success': False, 'error': 'Failed to analyze profile using AI'}), 500
            
        return jsonify({
            'success': True,
            'results': scan_results
        }), 200
        
    except Exception as e:
        print(f"Profile Scan Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
