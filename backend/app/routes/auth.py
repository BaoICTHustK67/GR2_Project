"""
Authentication Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from app import db
from app.models import User

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({
            'success': False,
            'message': 'Email, password, and name are required'
        }), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({
            'success': False,
            'message': 'User already exists. Please sign in.'
        }), 400
    
    # Create new user
    user = User(
        email=data['email'],
        name=data['name'],
        user_role=data.get('userRole', 'normal'),
        company_id=data.get('companyId')
    )
    user.set_password(data['password'])
    
    try:
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully. Please sign in.'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create account. Please try again.'
        }), 500


@bp.route('/signin', methods=['POST'])
def signin():
    """Sign in a user"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({
            'success': False,
            'message': 'Email and password are required'
        }), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User does not exist. Create an account.'
        }), 404
    
    if not user.check_password(data['password']):
        return jsonify({
            'success': False,
            'message': 'Invalid email or password'
        }), 401
    
    if user.status == 'deactivated':
        return jsonify({
            'success': False,
            'message': 'Account is deactivated. Please contact support.'
        }), 403
    
    # Create access token - identity must be a string
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={'email': user.email, 'role': user.user_role}
    )
    
    return jsonify({
        'success': True,
        'message': 'Signed in successfully',
        'token': access_token,
        'user': user.to_dict()
    })


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    return jsonify({
        'success': True,
        'user': user.to_dict()
    })


@bp.route('/signout', methods=['POST'])
@jwt_required()
def signout():
    """Sign out current user"""
    # In a production app, you might want to blacklist the token
    return jsonify({
        'success': True,
        'message': 'Signed out successfully'
    })


@bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if 'name' in data:
        user.name = data['name']
    if 'bio' in data:
        user.bio = data['bio']
    if 'location' in data:
        user.location = data['location']
    if 'headline' in data:
        user.headline = data['headline']
    if 'phone' in data:
        user.phone = data['phone']
    if 'website' in data:
        user.website = data['website']
    if 'linkedin' in data:
        user.linkedin = data['linkedin']
    if 'github' in data:
        user.github = data['github']
    if 'image' in data:
        user.image = data['image']
    if 'coverImage' in data:
        user.cover_image = data['coverImage']
    if 'darkMode' in data:
        user.dark_mode = data['darkMode']
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update profile'
        }), 500
