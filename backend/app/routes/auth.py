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


@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request a password reset email"""
    import secrets
    from datetime import datetime, timedelta
    from flask import current_app
    from flask_mail import Message
    from app import mail
    from app.models import PasswordResetToken
    
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({
            'success': False,
            'message': 'Email is required'
        }), 400
    
    # Always return success for security (don't reveal if email exists)
    # But only actually send email if user exists
    user = User.query.filter_by(email=email).first()
    
    if user and user.status == 'active':
        try:
            # Generate secure token
            token = secrets.token_urlsafe(32)
            expires_at = datetime.utcnow() + timedelta(hours=1)
            
            # Invalidate any existing tokens for this user
            PasswordResetToken.query.filter_by(user_id=user.id, used=False).update({'used': True})
            
            # Create new token
            reset_token = PasswordResetToken(
                user_id=user.id,
                token=token,
                expires_at=expires_at
            )
            db.session.add(reset_token)
            db.session.commit()
            
            # Send email
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
            reset_link = f"{frontend_url}/reset-password?token={token}"
            
            msg = Message(
                subject='Reset Your HustConnect Password',
                recipients=[user.email],
                html=f'''
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hi {user.name},</p>
                    <p>We received a request to reset your password for your HustConnect account.</p>
                    <p>Click the button below to reset your password:</p>
                    <p style="margin: 30px 0;">
                        <a href="{reset_link}" 
                           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Reset Password
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Or copy and paste this link into your browser:<br>
                        <a href="{reset_link}" style="color: #4F46E5; word-break: break-all;">{reset_link}</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        © HustConnect - Professional Networking Platform
                    </p>
                </div>
                '''
            )
            mail.send(msg)
            print(f"[INFO] Password reset email sent to {email}")
        except Exception as e:
            print(f"[ERROR] Failed to send password reset email: {e}")
            db.session.rollback()
    
    # Always return success for security
    return jsonify({
        'success': True,
        'message': 'If an account exists with that email, we have sent a password reset link.'
    })


@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    from datetime import datetime
    from app.models import PasswordResetToken
    
    data = request.get_json()
    token = data.get('token', '').strip()
    new_password = data.get('password', '')
    
    if not token:
        return jsonify({
            'success': False,
            'message': 'Reset token is required'
        }), 400
    
    if not new_password or len(new_password) < 6:
        return jsonify({
            'success': False,
            'message': 'Password must be at least 6 characters'
        }), 400
    
    # Find the token
    reset_token = PasswordResetToken.query.filter_by(token=token).first()
    
    if not reset_token:
        return jsonify({
            'success': False,
            'message': 'Invalid reset token'
        }), 400
    
    if reset_token.used:
        return jsonify({
            'success': False,
            'message': 'This reset link has already been used'
        }), 400
    
    if reset_token.expires_at < datetime.utcnow():
        return jsonify({
            'success': False,
            'message': 'This reset link has expired. Please request a new one.'
        }), 400
    
    try:
        # Update password
        user = reset_token.user
        user.set_password(new_password)
        
        # Mark token as used
        reset_token.used = True
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password has been reset successfully. You can now sign in.'
        })
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to reset password: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to reset password. Please try again.'
        }), 500
