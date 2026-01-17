from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import Interview, User, Feedback, Job
from datetime import datetime
import google.generativeai as genai
import os
import json
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request

bp = Blueprint('interviews', __name__, url_prefix='/api/interviews')

def clean_json(text):
    if not text:
        return "[]"
    clean = text.replace('```json', '').replace('```', '')
    return clean.strip()

@bp.route('/', methods=['GET'])
@jwt_required()
def get_interviews():
    try:
        current_user_id = int(get_jwt_identity())
        interviews = Interview.query.filter_by(user_id=current_user_id).order_by(Interview.created_at.desc()).all()
        return jsonify({
            'success': True,
            'interviews': [i.to_dict() for i in interviews]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/latest', methods=['GET'])
@jwt_required()
def get_latest_interviews():
    try:
        current_user_id = int(get_jwt_identity())
        limit = request.args.get('limit', 5, type=int)
        interviews = Interview.query.filter_by(user_id=current_user_id).order_by(Interview.created_at.desc()).limit(limit).all()
        return jsonify({
            'success': True,
            'interviews': [i.to_dict() for i in interviews]
        }), 200
    except Exception as e:
         return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/generate', methods=['POST'])
# @jwt_required() # User might be passed in body for now based on previous code, but ideally use JWT
def generate_interview_questions():
    try:
        # Check for JWT if available, else look in body (for transition support)
        current_user_id = None
        try:
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
        except:
            pass

        data = request.get_json()
        if not current_user_id:
             current_user_id = data.get('params', {}).get('userId') or data.get('userId')

        if not current_user_id:
             return jsonify({'success': False, 'error': 'User ID is required'}), 400
        
        role = data.get('role')
        level = data.get('level')
        tech_stack = data.get('techstack')
        interview_type = data.get('type', 'mixed')
        amount = data.get('amount', 5)

        # Configure Gemini
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
             return jsonify({'success': False, 'error': 'Server configuration error: Gemini API Key missing'}), 500
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        prompt = f"""Prepare questions for a job interview.
            The job role is {role}.
            The job experience level is {level}.
            The tech stack used in the job is: {tech_stack}.
            The focus between behavioural and technical questions should lean towards: {interview_type}.
            The amount of questions required is: {amount}.
            
            CRITICAL INSTRUCTION: Return ONLY a raw JSON array of strings. 
            Do not use Markdown formatting. Do not wrap in ```. 
            Example: ["Question 1", "Question 2"]
            
            The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters.
        """

        try:
            response = model.generate_content(prompt)
            raw_text = response.text
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return jsonify({'success': False, 'error': 'Failed to generate questions using AI'}), 500

        try:
            questions = json.loads(clean_json(raw_text))
        except (json.JSONDecodeError, ValueError) as e:
             print(f"JSON Parse Error: {e}")
             questions = [
                f"Tell me about your experience with {tech_stack}.",
                f"What are your strengths as a {role}?",
                "Describe a challenging technical problem you solved."
             ]

        tech_stack_list = tech_stack.split(',') if isinstance(tech_stack, str) else tech_stack
        tech_stack_list = [t.strip() for t in tech_stack_list]

        interview = Interview(
            user_id=int(current_user_id),
            role=role,
            interview_type=interview_type,
            tech_stack=tech_stack_list,
            questions=questions,
            finalized=False, 
            cover_image='/defaults/interview_cover.jpg'
        )

        db.session.add(interview)
        db.session.commit()

        return jsonify({
            'success': True, 
            'interviewId': interview.id,
            'questions': questions
        }), 200

    except Exception as e:
        print(f"Interview Generation Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:interview_id>', methods=['GET'])
@jwt_required()
def get_interview(interview_id):
    try:
        interview = Interview.query.get(interview_id)
        if not interview:
            return jsonify({'success': False, 'error': 'Interview not found'}), 404
        
        return jsonify({
            'success': True,
            'interview': interview.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Stubs for other endpoints
@bp.route('', methods=['POST'])
@jwt_required()
def create_interview():
    # Manual creation (stub)
    return jsonify({'success': True, 'message': 'Manual creation not implemented yet'}), 200

@bp.route('/from-job', methods=['POST'])
@jwt_required()
def create_interview_from_job():
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        data = request.get_json()
        job_id = data.get('jobId')
        
        if not job_id:
            return jsonify({'success': False, 'error': 'Job ID is required'}), 400
            
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'success': False, 'error': 'Job not found'}), 404

        # Gather user context
        from app.models import Education, Experience, Skill, Project
        educations = Education.query.filter_by(user_id=current_user_id).all()
        experiences = Experience.query.filter_by(user_id=current_user_id).all()
        skills = Skill.query.filter_by(user_id=current_user_id).all()
        projects = Project.query.filter_by(user_id=current_user_id).all()

        user_context = f"""
        User Name: {user.name}
        Headline: {user.headline}
        Bio: {user.bio}
        Skills: {', '.join([s.name for s in skills])}
        Experiences: {'; '.join([f"{e.title} at {e.company}" for e in experiences])}
        Education: {'; '.join([f"{edu.degree} from {edu.school}" for edu in educations])}
        Projects: {'; '.join([p.name for p in projects])}
        """

        job_context = f"""
        Job Title: {job.title}
        Company: {job.company.name if job.company else 'N/A'}
        Description: {job.description}
        Requirements: {', '.join(job.requirements) if isinstance(job.requirements, list) else job.requirements}
        """

        # Configure Gemini
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return jsonify({'success': False, 'error': 'Server configuration error: Gemini API Key missing'}), 500
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        prompt = f"""You are an expert interviewer for {job.title} at {job.company.name if job.company else 'a top company'}.
        
        Using the Job Context and User Background below, generate 5-7 specialized interview questions.
        The questions should:
        1. Test the technical skills required for the job.
        2. Specifically reference the candidate's background where relevant (e.g., how their experience at a past company or a specific project applies to this role).
        3. Include a mix of behavioral and technical questions.
        
        JOB CONTEXT:
        {job_context}
        
        CANDIDATE BACKGROUND:
        {user_context}
        
        CRITICAL INSTRUCTION: Return ONLY a raw JSON array of strings. 
        Do not use Markdown formatting. Do not wrap in ```. 
        Example: ["Question 1", "Question 2"]
        
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters.
        """

        try:
            response = model.generate_content(prompt)
            raw_text = response.text
            questions = json.loads(clean_json(raw_text))
        except Exception as e:
            print(f"AI Generation Error: {e}")
            # Fallback questions
            questions = [
                f"Tell me how your experience makes you a good fit for the {job.title} role.",
                f"Based on your projects, how would you approach the challenges mentioned in our job description?",
                "Describe a situation where you had to learn a new technology quickly to meet a project deadline.",
                f"How do your skills in {', '.join([s.name for s in skills[:3]])} align with our requirements?",
                "What motivates you to join our company?"
            ]

        interview = Interview(
            user_id=current_user_id,
            job_id=job.id,
            role=job.title,
            interview_type='mixed',
            tech_stack=job.requirements[:5] if isinstance(job.requirements, list) else [],
            questions=questions,
            finalized=False,
            cover_image='/defaults/interview_cover.jpg'
        )

        db.session.add(interview)
        db.session.commit()

        return jsonify({
            'success': True,
            'interviewId': interview.id,
            'questions': questions
        }), 201

    except Exception as e:
        print(f"Create Interview from Job Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:interview_id>', methods=['PUT'])
@jwt_required()
def update_interview(interview_id):
    return jsonify({'success': True, 'message': 'Update not implemented yet'}), 200

@bp.route('/<int:interview_id>', methods=['DELETE'])
@jwt_required()
def delete_interview(interview_id):
    try:
        current_user_id = int(get_jwt_identity())
        interview = Interview.query.get(interview_id)

        if not interview:
            return jsonify({'success': False, 'error': 'Interview not found'}), 404
        
        if interview.user_id != current_user_id:
             return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        # Feedback is set to cascade delete in models.py (cascade='all, delete-orphan')
        # So deleting the interview should automatically delete the feedback.
        # However, to be extra safe let's verify if we need to manually delete potential lingering feedback
        # interview.feedback is dynamic, so we can iterate and delete if cascade wasn't there
        # But looking at models.py: feedback = db.relationship('Feedback', backref='interview', lazy='dynamic', cascade='all, delete-orphan')
        # So standard delete should work fine.

        db.session.delete(interview)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Interview deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:interview_id>/feedback', methods=['GET', 'POST'])
@jwt_required()
def feedback_interview(interview_id):
    if request.method == 'GET':
        try:
             feedback_list = Feedback.query.filter_by(interview_id=interview_id).all()
             return jsonify({'success': True, 'feedback': [f.to_dict() for f in feedback_list]}), 200
        except Exception as e:
             return jsonify({'success': False, 'error': str(e)}), 500

    # POST: Generate Feedback
    try:
        data = request.get_json()
        transcript = data.get('transcript', [])
        
        # If transcript is empty, we can't really generate feedback
        if not transcript:
             return jsonify({'success': False, 'error': 'No transcript provided'}), 400

        interview = Interview.query.get(interview_id)
        if not interview:
            return jsonify({'success': False, 'error': 'Interview not found'}), 404

        # Configure Gemini
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
             return jsonify({'success': False, 'error': 'Server configuration error'}), 500
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Format transcript for AI
        transcript_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in transcript])

        prompt = f"""Analyze the following job interview transcript and provide feedback.
            
            Job Role: {interview.role}
            Experience Level: {interview.level if hasattr(interview, 'level') else 'N/A'}
            
            TRANSCRIPT:
            {transcript_text}

            Provide a detailed evaluation in JSON format with the following structure:
            {{
                "totalScore": <number 0-100>,
                "categoryScores": {{
                    "Communication": <number 0-100>,
                    "Technical Knowledge": <number 0-100>,
                    "Problem Solving": <number 0-100>,
                    "Cultural Fit": <number 0-100>
                }},
                "strengths": [<list of strings>],
                "areasForImprovement": [<list of strings>],
                "finalAssessment": "<summary text>"
            }}
            
            Return ONLY raw JSON.
        """

        try:
            response = model.generate_content(prompt)
            raw_text = response.text
            feedback_data = json.loads(clean_json(raw_text))
        except Exception as e:
            print(f"Feedback Generation Error: {e}")
            return jsonify({'success': False, 'error': 'Failed to generate feedback'}), 500

        # Create Feedback Record
        feedback = Feedback(
            interview_id=interview_id,
            user_id=interview.user_id,
            total_score=feedback_data.get('totalScore', 0),
            category_scores=feedback_data.get('categoryScores', {}),
            strengths=feedback_data.get('strengths', []),
            areas_for_improvement=feedback_data.get('areasForImprovement', []),
            final_assessment=feedback_data.get('finalAssessment', 'No assessment provided')
        )

        db.session.add(feedback)
        
        # Update interview as finalized if not already
        interview.finalized = True
        interview.completed_at = datetime.utcnow() # Ensure model has this column or update appropriately
        
        db.session.commit()

        return jsonify({
            'success': True,
            'feedbackId': feedback.id,
            'data': feedback.to_dict() 
        }), 201

    except Exception as e:
        print(f"Feedback Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
