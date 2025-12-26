"""
Companies Routes
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app import db
from app.models import Company, User, Job, CompanyJoinRequest

bp = Blueprint('companies', __name__, url_prefix='/api/companies')


@bp.route('/', methods=['GET'])
def get_companies():
    """Get all companies with pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    industry = request.args.get('industry', '')
    
    query = Company.query
    
    if search:
        query = query.filter(
            (Company.name.ilike(f'%{search}%')) |
            (Company.description.ilike(f'%{search}%'))
        )
    
    if industry:
        query = query.filter(Company.industry == industry)
    
    companies = query.order_by(Company.name).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'success': True,
        'companies': [company.to_dict() for company in companies.items],
        'total': companies.total,
        'pages': companies.pages,
        'currentPage': page
    })


@bp.route('/<int:company_id>', methods=['GET'])
def get_company(company_id):
    """Get a specific company"""
    company = Company.query.get(company_id)
    
    if not company:
        return jsonify({
            'success': False,
            'message': 'Company not found'
        }), 404
    
    # Check if current user is following this company
    is_following = False
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            user = User.query.get(int(user_id))
            if user and user in company.followers:
                is_following = True
    except Exception:
        pass
    
    return jsonify({
        'success': True,
        'company': company.to_dict(),
        'isFollowing': is_following
    })


@bp.route('/', methods=['POST'])
@jwt_required()
def create_company():
    """Create a new company (HR only)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.user_role not in ['hr', 'admin']:
        return jsonify({
            'success': False,
            'message': 'Only HR users can create companies'
        }), 403
    
    # Check if user already has a company
    if user.company_id:
        return jsonify({
            'success': False,
            'message': 'You are already associated with a company'
        }), 400
    
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({
            'success': False,
            'message': 'Company name is required'
        }), 400
    
    # Check if company with similar name exists
    existing = Company.query.filter(Company.name.ilike(data.get('name'))).first()
    if existing:
        return jsonify({
            'success': False,
            'message': 'A company with this name already exists. Please search and request to join instead.',
            'existingCompany': existing.to_dict()
        }), 409
    
    company = Company(
        name=data.get('name'),
        description=data.get('description'),
        logo=data.get('logo'),
        website=data.get('website'),
        industry=data.get('industry'),
        size=data.get('size'),
        location=data.get('location'),
        founded=data.get('founded'),
        created_by=user_id  # Set the creator as admin
    )
    
    try:
        db.session.add(company)
        db.session.commit()
        
        # Associate the HR user with the company
        user.company_id = company.id
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Company created successfully',
            'company': company.to_dict(),
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create company'
        }), 500


@bp.route('/<int:company_id>', methods=['PUT'])
@jwt_required()
def update_company(company_id):
    """Update a company"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    company = Company.query.get(company_id)
    
    if not company:
        return jsonify({
            'success': False,
            'message': 'Company not found'
        }), 404
    
    # Check if user belongs to this company
    if user.company_id != company_id and user.user_role != 'admin':
        return jsonify({
            'success': False,
            'message': 'You do not have permission to edit this company'
        }), 403
    
    data = request.get_json()
    
    if 'name' in data:
        company.name = data['name']
    if 'description' in data:
        company.description = data['description']
    if 'logo' in data:
        company.logo = data['logo']
    if 'website' in data:
        company.website = data['website']
    if 'industry' in data:
        company.industry = data['industry']
    if 'size' in data:
        company.size = data['size']
    if 'location' in data:
        company.location = data['location']
    if 'founded' in data:
        company.founded = data['founded']
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Company updated successfully',
            'company': company.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update company'
        }), 500


@bp.route('/<int:company_id>/follow', methods=['POST'])
@jwt_required()
def toggle_follow(company_id):
    """Toggle follow on a company"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    company = Company.query.get(company_id)
    
    if not company:
        return jsonify({
            'success': False,
            'message': 'Company not found'
        }), 404
    
    try:
        if user in company.followers:
            company.followers.remove(user)
            following = False
        else:
            company.followers.append(user)
            following = True
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'following': following,
            'followersCount': len(company.followers)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to toggle follow'
        }), 500


@bp.route('/<int:company_id>/jobs', methods=['GET'])
def get_company_jobs(company_id):
    """Get all published jobs for a company"""
    company = Company.query.get(company_id)
    
    if not company:
        return jsonify({
            'success': False,
            'message': 'Company not found'
        }), 404
    
    jobs = Job.query.filter_by(
        company_id=company_id,
        status='published'
    ).order_by(Job.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'jobs': [job.to_dict() for job in jobs]
    })


@bp.route('/<int:company_id>/followers', methods=['GET'])
def get_company_followers(company_id):
    """Get followers of a company"""
    company = Company.query.get(company_id)
    
    if not company:
        return jsonify({
            'success': False,
            'message': 'Company not found'
        }), 404
    
    return jsonify({
        'success': True,
        'followers': [user.to_dict() for user in company.followers],
        'count': len(company.followers)
    })


@bp.route('/my-company', methods=['GET'])
@jwt_required()
def get_my_company():
    """Get the company of the current HR user"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or not user.company_id:
        return jsonify({
            'success': False,
            'message': 'You are not associated with any company'
        }), 404
    
    company = Company.query.get(user.company_id)
    
    if not company:
        return jsonify({
            'success': False,
            'message': 'Company not found'
        }), 404
    
    # Check if user is admin of this company
    is_admin = company.created_by == user_id
    
    return jsonify({
        'success': True,
        'company': company.to_dict(include_hr_count=True),
        'isAdmin': is_admin
    })


@bp.route('/search', methods=['GET'])
@jwt_required()
def search_companies():
    """Search companies by name for join requests"""
    query = request.args.get('q', '').strip()
    
    if len(query) < 2:
        return jsonify({
            'success': True,
            'companies': []
        })
    
    companies = Company.query.filter(
        Company.name.ilike(f'%{query}%')
    ).limit(10).all()
    
    return jsonify({
        'success': True,
        'companies': [c.to_dict(include_hr_count=True) for c in companies]
    })


@bp.route('/<int:company_id>/request-join', methods=['POST'])
@jwt_required()
def request_join_company(company_id):
    """Request to join a company"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.user_role not in ['hr', 'admin']:
        return jsonify({
            'success': False,
            'message': 'Only HR users can request to join companies'
        }), 403
    
    # Check if user already has a company
    if user.company_id:
        return jsonify({
            'success': False,
            'message': 'You are already associated with a company'
        }), 400
    
    company = Company.query.get(company_id)
    if not company:
        return jsonify({
            'success': False,
            'message': 'Company not found'
        }), 404
    
    # Check for existing pending request
    existing_request = CompanyJoinRequest.query.filter_by(
        user_id=user_id,
        status='pending'
    ).first()
    
    if existing_request:
        return jsonify({
            'success': False,
            'message': 'You already have a pending join request'
        }), 400
    
    data = request.get_json() or {}
    
    join_request = CompanyJoinRequest(
        user_id=user_id,
        company_id=company_id,
        message=data.get('message', '')
    )
    
    try:
        db.session.add(join_request)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Join request sent successfully',
            'joinRequest': join_request.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to send join request'
        }), 500


@bp.route('/my-join-request', methods=['GET'])
@jwt_required()
def get_my_join_request():
    """Get current user's pending join request"""
    user_id = int(get_jwt_identity())
    
    join_request = CompanyJoinRequest.query.filter_by(
        user_id=user_id,
        status='pending'
    ).first()
    
    if not join_request:
        return jsonify({
            'success': False,
            'message': 'No pending join request'
        }), 404
    
    return jsonify({
        'success': True,
        'joinRequest': join_request.to_dict()
    })


@bp.route('/my-join-request', methods=['DELETE'])
@jwt_required()
def cancel_join_request():
    """Cancel current user's pending join request"""
    user_id = int(get_jwt_identity())
    
    join_request = CompanyJoinRequest.query.filter_by(
        user_id=user_id,
        status='pending'
    ).first()
    
    if not join_request:
        return jsonify({
            'success': False,
            'message': 'No pending join request'
        }), 404
    
    try:
        db.session.delete(join_request)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Join request cancelled'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to cancel join request'
        }), 500


@bp.route('/join-requests', methods=['GET'])
@jwt_required()
def get_company_join_requests():
    """Get pending join requests for company admin"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or not user.company_id:
        return jsonify({
            'success': False,
            'message': 'You are not associated with any company'
        }), 404
    
    company = Company.query.get(user.company_id)
    
    # Check if user is admin of this company
    if company.created_by != user_id and user.user_role != 'admin':
        return jsonify({
            'success': False,
            'message': 'Only company admins can view join requests'
        }), 403
    
    status = request.args.get('status', 'pending')
    
    requests = CompanyJoinRequest.query.filter_by(
        company_id=user.company_id,
        status=status
    ).order_by(CompanyJoinRequest.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'requests': [r.to_dict() for r in requests]
    })


@bp.route('/join-requests/<int:request_id>', methods=['PUT'])
@jwt_required()
def review_join_request(request_id):
    """Approve or reject a join request"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    join_request = CompanyJoinRequest.query.get(request_id)
    
    if not join_request:
        return jsonify({
            'success': False,
            'message': 'Join request not found'
        }), 404
    
    company = Company.query.get(join_request.company_id)
    
    # Check if user is admin of this company
    if company.created_by != user_id and user.user_role != 'admin':
        return jsonify({
            'success': False,
            'message': 'Only company admins can review join requests'
        }), 403
    
    if join_request.status != 'pending':
        return jsonify({
            'success': False,
            'message': 'This request has already been reviewed'
        }), 400
    
    data = request.get_json()
    action = data.get('action')  # 'approve' or 'reject'
    
    if action not in ['approve', 'reject']:
        return jsonify({
            'success': False,
            'message': 'Invalid action. Use "approve" or "reject"'
        }), 400
    
    try:
        join_request.status = 'approved' if action == 'approve' else 'rejected'
        join_request.reviewed_by = user_id
        join_request.reviewed_at = datetime.utcnow()
        
        if action == 'approve':
            # Add requester to the company
            requester = User.query.get(join_request.user_id)
            requester.company_id = join_request.company_id
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Join request {action}d successfully',
            'joinRequest': join_request.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to review join request'
        }), 500


@bp.route('/hr-members', methods=['GET'])
@jwt_required()
def get_company_hr_members():
    """Get all HR members of the current user's company"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or not user.company_id:
        return jsonify({
            'success': False,
            'message': 'You are not associated with any company'
        }), 404
    
    company = Company.query.get(user.company_id)
    hr_members = User.query.filter_by(company_id=user.company_id).all()
    
    return jsonify({
        'success': True,
        'members': [m.to_dict() for m in hr_members],
        'adminId': company.created_by
    })
