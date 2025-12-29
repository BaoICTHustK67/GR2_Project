"""
Jobs Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from app import db
from app.models import Job, Company, Application, User
from app.routes.notifications import notify_company_followers_new_job, notify_application_status_change

bp = Blueprint('jobs', __name__, url_prefix='/api/jobs')


@bp.route('/', methods=['GET'])
def get_jobs():
    """Get all published jobs with filtering and pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    location = request.args.get('location', '')
    job_type = request.args.get('jobType', '')
    
    query = Job.query.filter(Job.status == 'published')
    
    if search:
        query = query.join(Company).filter(
            (Job.title.ilike(f'%{search}%')) |
            (Company.name.ilike(f'%{search}%'))
        )
    
    if location:
        query = query.filter(Job.location.ilike(f'%{location}%'))
    
    if job_type:
        query = query.filter(Job.job_type == job_type)
    
    query = query.order_by(Job.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'jobs': [job.to_dict() for job in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'currentPage': page
    })


@bp.route('/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get a specific job by ID"""
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({
            'success': False,
            'message': 'Job not found'
        }), 404
    
    job_data = job.to_dict()
    
    # Check if user is authenticated and has applied to this job
    user_application = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            application = Application.query.filter_by(
                job_id=job_id,
                user_id=int(user_id)
            ).first()
            if application:
                user_application = {
                    'id': application.id,
                    'status': application.status,
                    'appliedAt': application.created_at.isoformat() + 'Z' if application.created_at else None
                }
    except Exception:
        pass
    
    return jsonify({
        'success': True,
        'job': job_data,
        'userApplication': user_application
    })


@bp.route('/', methods=['POST'])
@jwt_required()
def create_job():
    """Create a new job posting (HR only)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.user_role != 'hr':
        return jsonify({
            'success': False,
            'message': 'Only HR users can create job postings'
        }), 403
    
    if not user.company_id:
        return jsonify({
            'success': False,
            'message': 'You must be associated with a company to create jobs'
        }), 400
    
    data = request.get_json()
    
    job = Job(
        title=data.get('title'),
        description=data.get('description'),
        location=data.get('location'),
        job_type=data.get('jobType'),
        experience_level=data.get('experienceLevel'),
        salary_min=data.get('salaryMin'),
        salary_max=data.get('salaryMax'),
        responsibilities=data.get('responsibilities', []),
        requirements=data.get('requirements', []),
        benefits=data.get('benefits', []),
        status=data.get('status', 'published'),
        company_id=user.company_id,
        created_by=user_id
    )
    
    try:
        db.session.add(job)
        db.session.commit()
        
        # Notify company followers about the new job if it's published
        if job.status == 'published':
            company = Company.query.get(user.company_id)
            if company:
                notify_company_followers_new_job(company, job)
                db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Job created successfully',
            'job': job.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create job'
        }), 500


@bp.route('/<int:job_id>', methods=['PUT'])
@jwt_required()
def update_job(job_id):
    """Update a job posting"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({
            'success': False,
            'message': 'Job not found'
        }), 404
    
    # Check if user owns this job or is admin
    if job.created_by != user_id and user.user_role != 'admin':
        return jsonify({
            'success': False,
            'message': 'You do not have permission to edit this job'
        }), 403
    
    data = request.get_json()
    
    if 'title' in data:
        job.title = data['title']
    if 'description' in data:
        job.description = data['description']
    if 'location' in data:
        job.location = data['location']
    if 'jobType' in data:
        job.job_type = data['jobType']
    if 'experienceLevel' in data:
        job.experience_level = data['experienceLevel']
    if 'salaryMin' in data:
        job.salary_min = data['salaryMin']
    if 'salaryMax' in data:
        job.salary_max = data['salaryMax']
    if 'responsibilities' in data:
        job.responsibilities = data['responsibilities']
    if 'requirements' in data:
        job.requirements = data['requirements']
    if 'benefits' in data:
        job.benefits = data['benefits']
    if 'status' in data:
        job.status = data['status']
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Job updated successfully',
            'job': job.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update job'
        }), 500


@bp.route('/<int:job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    """Delete a job posting"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({
            'success': False,
            'message': 'Job not found'
        }), 404
    
    if job.created_by != user_id and user.user_role != 'admin':
        return jsonify({
            'success': False,
            'message': 'You do not have permission to delete this job'
        }), 403
    
    try:
        db.session.delete(job)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Job deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete job'
        }), 500


@bp.route('/<int:job_id>/apply', methods=['POST'])
@jwt_required()
def apply_to_job(job_id):
    """Apply to a job"""
    user_id = int(get_jwt_identity())
    
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({
            'success': False,
            'message': 'Job not found'
        }), 404
    
    if job.status != 'published':
        return jsonify({
            'success': False,
            'message': 'This job is no longer accepting applications'
        }), 400
    
    # Check if already applied
    existing_application = Application.query.filter_by(
        job_id=job_id,
        user_id=user_id
    ).first()
    
    if existing_application:
        return jsonify({
            'success': False,
            'message': 'You have already applied to this job'
        }), 400
    
    data = request.get_json()
    
    application = Application(
        job_id=job_id,
        user_id=user_id,
        full_name=data.get('fullName'),
        email=data.get('email'),
        phone=data.get('phone'),
        cv_link=data.get('cvLink'),
        cover_letter=data.get('coverLetter')
    )
    
    try:
        db.session.add(application)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Application submitted successfully',
            'application': application.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to submit application'
        }), 500


@bp.route('/<int:job_id>/applications', methods=['GET'])
@jwt_required()
def get_job_applications(job_id):
    """Get all applications for a job (HR only)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({
            'success': False,
            'message': 'Job not found'
        }), 404
    
    # Check if user owns this job or is admin
    if job.created_by != user_id and user.user_role not in ['hr', 'admin']:
        return jsonify({
            'success': False,
            'message': 'You do not have permission to view applications'
        }), 403
    
    applications = Application.query.filter_by(job_id=job_id).all()
    
    return jsonify({
        'success': True,
        'applications': [app.to_dict() for app in applications]
    })


@bp.route('/applications/<int:app_id>/status', methods=['PATCH'])
@jwt_required()
def update_application_status(app_id):
    """Update application status (HR only)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    application = Application.query.get(app_id)
    
    if not application:
        return jsonify({
            'success': False,
            'message': 'Application not found'
        }), 404
    
    job = application.job
    
    if job.created_by != user_id and user.user_role not in ['hr', 'admin']:
        return jsonify({
            'success': False,
            'message': 'You do not have permission to update this application'
        }), 403
    
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['pending', 'reviewed', 'accepted', 'rejected']:
        return jsonify({
            'success': False,
            'message': 'Invalid status'
        }), 400
    
    old_status = application.status
    application.status = new_status
    
    try:
        db.session.commit()
        
        # Notify applicant about status change
        if old_status != new_status:
            notify_application_status_change(application, old_status, new_status)
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Application status updated',
            'application': application.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update application status'
        }), 500


@bp.route('/my-applications', methods=['GET'])
@jwt_required()
def get_my_applications():
    """Get current user's job applications"""
    user_id = int(get_jwt_identity())
    
    applications = Application.query.filter_by(user_id=user_id).order_by(
        Application.created_at.desc()
    ).all()
    
    return jsonify({
        'success': True,
        'applications': [app.to_dict() for app in applications]
    })


@bp.route('/hr/jobs', methods=['GET'])
@jwt_required()
def get_hr_jobs():
    """Get all jobs created by the HR user or their company"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.user_role not in ['hr', 'admin']:
        return jsonify({
            'success': False,
            'message': 'Only HR users can access this endpoint'
        }), 403
    
    # If user has a company, get all jobs from that company
    if user.company_id:
        jobs = Job.query.filter_by(company_id=user.company_id).order_by(
            Job.created_at.desc()
        ).all()
    else:
        # Otherwise get jobs created by this user
        jobs = Job.query.filter_by(created_by=user_id).order_by(
            Job.created_at.desc()
        ).all()
    
    return jsonify({
        'success': True,
        'jobs': [job.to_dict() for job in jobs]
    })


@bp.route('/hr/metrics', methods=['GET'])
@jwt_required()
def get_hr_metrics():
    """Get HR dashboard metrics"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.user_role not in ['hr', 'admin']:
        return jsonify({
            'success': False,
            'message': 'Only HR users can access this endpoint'
        }), 403
    
    # Get jobs for this HR user or their company
    if user.company_id:
        jobs = Job.query.filter_by(company_id=user.company_id).all()
    else:
        jobs = Job.query.filter_by(created_by=user_id).all()
    
    total_jobs = len(jobs)
    open_positions = len([j for j in jobs if j.status == 'published'])
    
    # Get all applications for HR's jobs
    job_ids = [j.id for j in jobs]
    applications = Application.query.filter(Application.job_id.in_(job_ids)).all() if job_ids else []
    
    total_applicants = len(applications)
    pending_applications = len([a for a in applications if a.status == 'pending'])
    
    avg_applicants = total_applicants / total_jobs if total_jobs > 0 else 0
    
    return jsonify({
        'success': True,
        'metrics': {
            'totalJobsPosted': total_jobs,
            'openPositions': open_positions,
            'totalApplicants': total_applicants,
            'pendingApplications': pending_applications,
            'averageApplicantsPerJob': round(avg_applicants, 1)
        }
    })


@bp.route('/hr/recent-applications', methods=['GET'])
@jwt_required()
def get_hr_recent_applications():
    """Get recent applications for HR dashboard"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.user_role not in ['hr', 'admin']:
        return jsonify({
            'success': False,
            'message': 'Only HR users can access this endpoint'
        }), 403
    
    # Get jobs created by this HR user or their company
    if user.company_id:
        # Get all jobs from the company
        jobs = Job.query.filter_by(company_id=user.company_id).all()
    else:
        # Get only jobs created by this user
        jobs = Job.query.filter_by(created_by=user_id).all()
    
    job_ids = [j.id for j in jobs]
    
    # Get recent applications
    limit = request.args.get('limit', 10, type=int)
    applications = Application.query.filter(
        Application.job_id.in_(job_ids)
    ).order_by(Application.created_at.desc()).limit(limit).all()
    
    result = []
    for app in applications:
        applicant = app.applicant
        result.append({
            'id': app.id,
            'applicantName': app.full_name or (applicant.name if applicant else 'Unknown'),
            'applicantEmail': app.email,
            'applicantPhone': app.phone,
            'applicantImage': applicant.image if applicant else None,
            'applicantBio': applicant.bio if applicant else None,
            'applicantHeadline': applicant.headline if applicant else None,
            'applicantLocation': applicant.location if applicant else None,
            'applicantId': applicant.id if applicant else None,
            'cvLink': app.cv_link,
            'coverLetter': app.cover_letter,
            'jobId': app.job_id,
            'jobTitle': app.job.title if app.job else 'Unknown',
            'jobLocation': app.job.location if app.job else None,
            'jobType': app.job.job_type if app.job else None,
            'status': app.status,
            'appliedAt': app.created_at.isoformat() + 'Z' if app.created_at else None
        })
    
    return jsonify({
        'success': True,
        'applications': result
    })


@bp.route('/applications/<int:app_id>', methods=['GET'])
@jwt_required()
def get_application_details(app_id):
    """Get full application details including applicant profile"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    application = Application.query.get(app_id)
    
    if not application:
        return jsonify({
            'success': False,
            'message': 'Application not found'
        }), 404
    
    job = application.job
    
    # Check permission - must be HR of the company or job creator
    if job.created_by != user_id and user.user_role not in ['hr', 'admin']:
        return jsonify({
            'success': False,
            'message': 'You do not have permission to view this application'
        }), 403
    
    if user.company_id and job.company_id != user.company_id:
        return jsonify({
            'success': False,
            'message': 'You do not have permission to view this application'
        }), 403
    
    applicant = application.applicant
    
    # Get applicant's education, experience, skills, projects
    applicant_data = None
    if applicant:
        from app.models import Education, Experience, Skill, Project
        
        educations = Education.query.filter_by(user_id=applicant.id).order_by(Education.start_date.desc()).all()
        experiences = Experience.query.filter_by(user_id=applicant.id).order_by(Experience.start_date.desc()).all()
        skills = Skill.query.filter_by(user_id=applicant.id).all()
        projects = Project.query.filter_by(user_id=applicant.id).all()
        
        applicant_data = {
            'id': applicant.id,
            'name': applicant.name,
            'email': applicant.email,
            'image': applicant.image,
            'coverImage': applicant.cover_image,
            'bio': applicant.bio,
            'headline': applicant.headline,
            'location': applicant.location,
            'educations': [e.to_dict() for e in educations],
            'experiences': [e.to_dict() for e in experiences],
            'skills': [s.to_dict() for s in skills],
            'projects': [p.to_dict() for p in projects],
        }
    
    return jsonify({
        'success': True,
        'application': {
            'id': application.id,
            'fullName': application.full_name,
            'email': application.email,
            'phone': application.phone,
            'cvLink': application.cv_link,
            'coverLetter': application.cover_letter,
            'status': application.status,
            'appliedAt': application.created_at.isoformat() + 'Z' if application.created_at else None,
            'job': {
                'id': job.id,
                'title': job.title,
                'location': job.location,
                'jobType': job.job_type,
                'company': job.company.to_dict() if job.company else None
            },
            'applicant': applicant_data
        }
    })
