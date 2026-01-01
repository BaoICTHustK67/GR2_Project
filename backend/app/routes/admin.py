"""
Admin Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Job, Interview, BlogPost, Company, Application
from functools import wraps
from datetime import datetime, timedelta

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or user.user_role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Admin privileges required'
            }), 403
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/analytics', methods=['GET'])
@admin_required
def get_analytics():
    """Get system-wide analytics"""
    total_users = User.query.count()
    active_users = User.query.filter_by(status='active').count()
    total_jobs = Job.query.count()
    published_jobs = Job.query.filter_by(status='published').count()
    total_interviews = Interview.query.count()
    total_posts = BlogPost.query.count()
    total_companies = Company.query.count()
    total_applications = Application.query.count()

    # Get growth data (last 7 days daily)
    growth_data = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        next_day = day + timedelta(days=1)
        
        day_users = User.query.filter(
            User.created_at >= datetime.combine(day, datetime.min.time()),
            User.created_at < datetime.combine(next_day, datetime.min.time())
        ).count()
        
        day_jobs = Job.query.filter(
            Job.created_at >= datetime.combine(day, datetime.min.time()),
            Job.created_at < datetime.combine(next_day, datetime.min.time())
        ).count()
        
        growth_data.append({
            'name': day.strftime('%a'),
            'users': day_users,
            'jobs': day_jobs
        })

    # Get role distribution
    normal_count = User.query.filter_by(user_role='normal').count()
    hr_count = User.query.filter_by(user_role='hr').count()
    admin_count = User.query.filter_by(user_role='admin').count()
    
    total_role_count = normal_count + hr_count + admin_count
    
    role_distribution = [
        {'name': 'Normal', 'value': round((normal_count / total_role_count * 100), 1) if total_role_count > 0 else 0},
        {'name': 'HR', 'value': round((hr_count / total_role_count * 100), 1) if total_role_count > 0 else 0},
        {'name': 'Admin', 'value': round((admin_count / total_role_count * 100), 1) if total_role_count > 0 else 0}
    ]
    
    # Get recent growth (last 7 days total)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_users = User.query.filter(User.created_at >= seven_days_ago).count()
    
    return jsonify({
        'success': True,
        'analytics': {
            'users': {
                'total': total_users,
                'active': active_users,
                'growth': recent_users
            },
            'jobs': {
                'total': total_jobs,
                'published': published_jobs
            },
            'interviews': {
                'total': total_interviews
            },
            'posts': {
                'total': total_posts
            },
            'companies': {
                'total': total_companies
            },
            'applications': {
                'total': total_applications
            },
            'growthData': growth_data,
            'roleDistribution': role_distribution
        }
    })

@bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """Get all users (admin view)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    
    query = User.query
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

@bp.route('/users/<int:user_id>/status', methods=['PUT'])
@admin_required
def update_user_status(user_id):
    """Activate or deactivate a user"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'status' in data:
        if data['status'] in ['active', 'deactivated']:
            user.status = data['status']
            db.session.commit()
            return jsonify({
                'success': True,
                'message': f'User status updated to {user.status}',
                'user': user.to_dict()
            })
    
    return jsonify({
        'success': False,
        'message': 'Invalid status provided'
    }), 400

@bp.route('/users/<int:user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(user_id):
    """Update user role"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'role' in data:
        if data['role'] in ['normal', 'hr', 'admin']:
            user.user_role = data['role']
            db.session.commit()
            return jsonify({
                'success': True,
                'message': f'User role updated to {user.user_role}',
                'user': user.to_dict()
            })
    
    return jsonify({
        'success': False,
        'message': 'Invalid role provided'
    }), 400

@bp.route('/jobs', methods=['GET'])
@admin_required
def get_all_jobs():
    """Get all jobs across the system"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pagination = Job.query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'jobs': [job.to_dict() for job in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'currentPage': page
    })

@bp.route('/interviews', methods=['GET'])
@admin_required
def get_all_interviews():
    """Get all interviews across the system"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pagination = Interview.query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'interviews': [interview.to_dict() for interview in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'currentPage': page
    })

@bp.route('/blogs', methods=['GET'])
@admin_required
def get_all_blogs():
    """Get all blog posts across the system"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pagination = BlogPost.query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'blogs': [post.to_dict() for post in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'currentPage': page
    })

@bp.route('/jobs/<int:job_id>', methods=['DELETE'])
@admin_required
def delete_job(job_id):
    """Delete a job posting"""
    job = Job.query.get_or_404(job_id)
    db.session.delete(job)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Job deleted successfully'
    })

@bp.route('/interviews/<int:interview_id>', methods=['DELETE'])
@admin_required
def delete_interview(interview_id):
    """Delete an interview record"""
    interview = Interview.query.get_or_404(interview_id)
    db.session.delete(interview)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Interview deleted successfully'
    })

@bp.route('/blogs/<int:post_id>', methods=['DELETE'])
@admin_required
def delete_blog(post_id):
    """Delete a blog post"""
    post = BlogPost.query.get_or_404(post_id)
    db.session.delete(post)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Blog post deleted successfully'
    })
