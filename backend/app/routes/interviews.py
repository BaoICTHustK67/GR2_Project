"""
Interviews Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Interview, Feedback, Job, User
import random

bp = Blueprint('interviews', __name__, url_prefix='/api/interviews')

# Sample interview cover images
INTERVIEW_COVERS = [
    '/interview1.jpg',
    '/interview2.jpg',
    '/interview3.jpg',
    '/interview4.jpg',
    '/interview5.jpg'
]


def get_random_cover():
    return random.choice(INTERVIEW_COVERS)


@bp.route('/', methods=['GET'])
@jwt_required()
def get_interviews():
    """Get all interviews for the current user"""
    user_id = int(get_jwt_identity())
    
    interviews = Interview.query.filter_by(user_id=user_id).order_by(
        Interview.created_at.desc()
    ).all()
    
    return jsonify({
        'success': True,
        'interviews': [interview.to_dict() for interview in interviews]
    })


@bp.route('/latest', methods=['GET'])
@jwt_required()
def get_latest_interviews():
    """Get latest finalized interviews (excluding current user)"""
    user_id = int(get_jwt_identity())
    limit = request.args.get('limit', 20, type=int)
    
    interviews = Interview.query.filter(
        Interview.user_id != user_id,
        Interview.finalized == True
    ).order_by(Interview.created_at.desc()).limit(limit).all()
    
    return jsonify({
        'success': True,
        'interviews': [interview.to_dict() for interview in interviews]
    })


@bp.route('/<int:interview_id>', methods=['GET'])
@jwt_required()
def get_interview(interview_id):
    """Get a specific interview"""
    interview = Interview.query.get(interview_id)
    
    if not interview:
        return jsonify({
            'success': False,
            'message': 'Interview not found'
        }), 404
    
    return jsonify({
        'success': True,
        'interview': interview.to_dict()
    })


@bp.route('/', methods=['POST'])
@jwt_required()
def create_interview():
    """Create a new interview"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    interview = Interview(
        user_id=user_id,
        job_id=data.get('jobId'),
        role=data.get('role'),
        interview_type=data.get('type', 'behavioral'),
        tech_stack=data.get('techstack', []),
        questions=data.get('questions', []),
        cover_image=get_random_cover()
    )
    
    try:
        db.session.add(interview)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Interview created successfully',
            'interview': interview.to_dict(),
            'interviewId': interview.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create interview'
        }), 500


@bp.route('/from-job', methods=['POST'])
@jwt_required()
def create_interview_from_job():
    """Create an interview based on a job posting"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    job_id = data.get('jobId')
    
    if not job_id:
        return jsonify({
            'success': False,
            'message': 'Job ID is required'
        }), 400
    
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({
            'success': False,
            'message': 'Job not found'
        }), 404
    
    # Generate questions based on job requirements
    questions = generate_interview_questions(job)
    
    # Extract tech stack from requirements
    tech_stack = extract_tech_stack(job.requirements or [])
    
    interview = Interview(
        user_id=user_id,
        job_id=job_id,
        role=job.title,
        interview_type='mixed',
        tech_stack=tech_stack,
        questions=questions,
        cover_image=get_random_cover()
    )
    
    try:
        db.session.add(interview)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Interview created successfully',
            'interview': interview.to_dict(),
            'interviewId': interview.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create interview'
        }), 500


def generate_interview_questions(job):
    """Generate interview questions based on job details"""
    questions = []
    
    # Behavioral questions
    questions.extend([
        f"Tell me about yourself and why you're interested in the {job.title} position.",
        "Describe a challenging project you've worked on and how you handled it.",
        "How do you prioritize tasks when working on multiple projects?",
        "Tell me about a time you had to work with a difficult team member.",
        "Where do you see yourself in 5 years?"
    ])
    
    # Technical questions based on requirements
    if job.requirements:
        for req in job.requirements[:3]:
            questions.append(f"Can you explain your experience with {req}?")
    
    # Role-specific questions
    questions.extend([
        f"What skills make you a good fit for this {job.title} role?",
        "How do you stay updated with industry trends?",
        "Do you have any questions for us about the role or company?"
    ])
    
    return questions


def extract_tech_stack(requirements):
    """Extract technology stack from requirements"""
    common_technologies = [
        "JavaScript", "TypeScript", "React", "Next.js", "Vue", "Angular",
        "Node.js", "Express", "Python", "Django", "Flask", "Java", "Spring",
        "C#", ".NET", "PHP", "Laravel", "Ruby", "Rails", "Go", "Rust",
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "MongoDB",
        "PostgreSQL", "MySQL", "Redis", "GraphQL", "REST", "HTML", "CSS",
        "TailwindCSS", "Bootstrap", "Firebase", "Supabase"
    ]
    
    tech_stack = []
    requirements_text = ' '.join(requirements).lower()
    
    for tech in common_technologies:
        if tech.lower() in requirements_text:
            tech_stack.append(tech)
    
    return tech_stack[:5]  # Limit to 5 technologies


@bp.route('/<int:interview_id>', methods=['PUT'])
@jwt_required()
def update_interview(interview_id):
    """Update an interview"""
    user_id = int(get_jwt_identity())
    interview = Interview.query.get(interview_id)
    
    if not interview:
        return jsonify({
            'success': False,
            'message': 'Interview not found'
        }), 404
    
    if interview.user_id != user_id:
        return jsonify({
            'success': False,
            'message': 'You can only edit your own interviews'
        }), 403
    
    data = request.get_json()
    
    if 'finalized' in data:
        interview.finalized = data['finalized']
    if 'questions' in data:
        interview.questions = data['questions']
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Interview updated',
            'interview': interview.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update interview'
        }), 500


@bp.route('/<int:interview_id>/feedback', methods=['GET'])
@jwt_required()
def get_feedback(interview_id):
    """Get feedback for an interview"""
    user_id = int(get_jwt_identity())
    
    feedback = Feedback.query.filter_by(
        interview_id=interview_id,
        user_id=user_id
    ).first()
    
    if not feedback:
        return jsonify({
            'success': False,
            'message': 'Feedback not found'
        }), 404
    
    return jsonify({
        'success': True,
        'feedback': feedback.to_dict()
    })


@bp.route('/<int:interview_id>/feedback', methods=['POST'])
@jwt_required()
def create_feedback(interview_id):
    """Create or update feedback for an interview"""
    user_id = int(get_jwt_identity())
    interview = Interview.query.get(interview_id)
    
    if not interview:
        return jsonify({
            'success': False,
            'message': 'Interview not found'
        }), 404
    
    data = request.get_json()
    
    # Check if feedback already exists
    existing_feedback = Feedback.query.filter_by(
        interview_id=interview_id,
        user_id=user_id
    ).first()
    
    if existing_feedback:
        # Update existing feedback
        existing_feedback.total_score = data.get('totalScore')
        existing_feedback.category_scores = data.get('categoryScores', {})
        existing_feedback.strengths = data.get('strengths', [])
        existing_feedback.areas_for_improvement = data.get('areasForImprovement', [])
        existing_feedback.final_assessment = data.get('finalAssessment')
        
        try:
            db.session.commit()
            return jsonify({
                'success': True,
                'message': 'Feedback updated',
                'feedback': existing_feedback.to_dict(),
                'feedbackId': existing_feedback.id
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'success': False,
                'message': 'Failed to update feedback'
            }), 500
    else:
        # Create new feedback
        feedback = Feedback(
            interview_id=interview_id,
            user_id=user_id,
            total_score=data.get('totalScore'),
            category_scores=data.get('categoryScores', {}),
            strengths=data.get('strengths', []),
            areas_for_improvement=data.get('areasForImprovement', []),
            final_assessment=data.get('finalAssessment')
        )
        
        try:
            db.session.add(feedback)
            # Mark interview as finalized
            interview.finalized = True
            db.session.commit()
            return jsonify({
                'success': True,
                'message': 'Feedback created',
                'feedback': feedback.to_dict(),
                'feedbackId': feedback.id
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'success': False,
                'message': 'Failed to create feedback'
            }), 500
