import requests
import json
import getpass
import random

BASE_URL = "http://localhost:5000/api"

# Job Categories and Templates
CATEGORIES = [
    {
        "name": "AI & Machine Learning",
        "titles": ["Senior AI Engineer", "Computer Vision Specialist", "NLP Researcher"],
        "description": "Join our AI lab to work on cutting-edge models for {context}. You will be responsible for scaling AI solutions and delivering high-impact features.",
        "responsibilities": [
            "Implement and optimize {context} models.",
            "Collaborate with data engineers to build robust pipelines.",
            "Stay updated with the latest research in deep learning.",
            "Mentor junior data scientists and engineers."
        ],
        "requirements": [
            "Strong proficiency in Python and deep learning frameworks (PyTorch/TensorFlow).",
            "Experience with large-scale data processing.",
            "PhD or Master's in a quantitative field preferred.",
            "Published research or significant project portfolio."
        ],
        "contexts": ["automated recruiting", "natural language understanding", "predictive analytics"]
    },
    {
        "name": "Cloud & DevOps",
        "titles": ["Cloud Architect", "Site Reliability Engineer", "DevOps Specialist"],
        "description": "Design and maintain our {context} infrastructure. We are looking for cloud experts who love automation and high availability.",
        "responsibilities": [
            "Manage and monitor {context} clusters.",
            "Automate deployment pipelines using CI/CD tools.",
            "Ensure system security and disaster recovery compliance.",
            "Optimize cloud costs and resource utilization."
        ],
        "requirements": [
            "Expertise in AWS, Azure, or GCP.",
            "Strong skills in Kubernetes and Docker.",
            "Proficiency in Terraform or Ansible.",
            "Understanding of networking and security protocols."
        ],
        "contexts": ["multi-regional", "microservices-based", "high-traffic production"]
    },
    {
        "name": "Backend Development",
        "titles": ["Senior Backend Developer", "Python/Flask Engineer", "Distributed Systems Engineer"],
        "description": "Build the core services that power our {context}. You will handle complex data structures and high-concurrency demands.",
        "responsibilities": [
            "Develop scalable APIs for {context}.",
            "Design and optimize database schemas (SQL/NoSQL).",
            "Implement caching and messaging systems.",
            "Perform code reviews and maintain high code quality."
        ],
        "requirements": [
            "Deep knowledge of Python, Go, or Node.js.",
            "Experience with PostgreSQL, Redis, and Kafka.",
            "Understanding of microservices architecture.",
            "Solid grasp of testing and debugging techniques."
        ],
        "contexts": ["real-time messaging", "secure payment processing", "dynamic content delivery"]
    },
    {
        "name": "Frontend Development",
        "titles": ["Lead Frontend Engineer", "React Developer", "UI Developer"],
        "description": "Create delightful user experiences for our {context}. We value polish, accessibility, and modern design patterns.",
        "responsibilities": [
            "Build responsive components using {framework}.",
            "Implement state management and data fetching logic.",
            "Optimize web performance and core web vitals.",
            "Collaborate with UX designers to bridge design and code."
        ],
        "requirements": [
            "Expertise in React, TypeScript, and CSS-in-JS.",
            "Experience with modern build tools (Vite, Webpack).",
            "Strong understanding of browser APIs and security.",
            "Passion for creating smooth animations and interactions."
        ],
        "frameworks": ["React & Tailwind CSS", "Next.js & Material UI", "Vue.js & Shadcn UI"],
        "contexts": ["interactive dashboard", "complex job search portal", "user analytics platform"]
    },
    {
        "name": "Mobile Development",
        "titles": ["iOS Engineer (Swift)", "Android Developer (Kotlin)", "React Native Expert"],
        "description": "Shape the mobile experience for {context}. You will deliver high-quality apps that users love on both iOS and Android.",
        "responsibilities": [
            "Develop features for the {context} mobile app.",
            "Ensure cross-platform compatibility and performance.",
            "Integrate with backend services via REST or GraphQL.",
            "Participate in the full mobile release lifecycle."
        ],
        "requirements": [
            "Solid experience in mobile-first development.",
            "Knowledge of mobile UI/UX guidelines.",
            "Experience with native bridging or platform-specific APIs.",
            "Familiarity with mobile CI/CD (Fastlane, Bitrise)."
        ],
        "contexts": ["recruitment networking", "video interview recording", "real-time job notifications"]
    },
    {
        "name": "Data Science & Analytics",
        "titles": ["Data Scientist", "Business Intelligence Analyst", "Data Engineer"],
        "description": "Extract meaningful insights from {context}. You will help us drive decisions through data-driven storytelling.",
        "responsibilities": [
            "Analyze {context} data to find growth opportunities.",
            "Build and maintain data warehouses and ETL pipelines.",
            "Create interactive dashboards for executive reporting.",
            "Conduct A/B testing and statistical analysis."
        ],
        "requirements": [
            "Strong skills in SQL and Python/R.",
            "Experience with PowerBI, Tableau, or similar tools.",
            "Understanding of statistical modeling.",
            "Excellent communication and presentation skills."
        ],
        "contexts": ["user engagement metrics", "market salary trends", "recruiter performance data"]
    },
    {
        "name": "Cybersecurity",
        "titles": ["Security Analyst", "Penetration Tester", "Cloud Security Engineer"],
        "description": "Guard our systems and user data against threats. You will be proactive in identifying vulnerabilities in our {context}.",
        "responsibilities": [
            "Conduct security audits of {context} infrastructure.",
            "Implement zero-trust security architecture.",
            "Respond to and investigate security incidents.",
            "Advise engineering teams on secure coding practices."
        ],
        "requirements": [
            "Certifications like CISSP, CEH, or OSCP.",
            "Deep knowledge of network security and encryption.",
            "Experience with security automation tools.",
            "Understading of compliance frameworks (GDPR, ISO27001)."
        ],
        "contexts": ["sensitive PII handling", "financial transaction logs", "public-facing API endpoints"]
    },
    {
        "name": "Business Analyst",
        "titles": ["Product Business Analyst", "Technical BA", "Strategy Analyst"],
        "description": "Bridge the gap between business and technology for {context}. You will transform complex needs into clear roadmaps.",
        "responsibilities": [
            "Define product requirements for {context}.",
            "Facilitate communication between stakeholders and developers.",
            "Analyze market trends and competitor features.",
            "Oversee user acceptance testing and feedback cycles."
        ],
        "requirements": [
            "Strong analytical and documentation skills.",
            "Experience with Agile/Scrum methodologies.",
            "Proficiency in Jira, Confluence, and modeling tools.",
            "Excellent negotiation and interpersonal skills."
        ],
        "contexts": ["enterprise hiring platform", "global workforce expansion", "AI-driven recruiting automation"]
    },
    {
        "name": "Product Management",
        "titles": ["Product Manager", "Technical PM", "Growth Product Manager"],
        "description": "Lead the vision for {context}. You will be responsible for the 'what' and 'why' of our product evolution.",
        "responsibilities": [
            "Define and track product success metrics for {context}.",
            "Engage with users to understand pain points and needs.",
            "Prioritize features based on impact and feasibility.",
            "Communicate the product vision to all levels of the company."
        ],
        "requirements": [
            "Previous experience in software product management.",
            "Strategic thinking with a tactical execution mindset.",
            "Ability to influence without authority.",
            "Strong empathy for users and business stakeholders."
        ],
        "contexts": ["automated candidate sourcing", "community-driven jobs board", "seamless interview scheduling"]
    },
    {
        "name": "UI/UX Design",
        "titles": ["Product Designer", "User Researcher", "Visual Designer"],
        "description": "Design elegant and accessible interfaces for {context}. We believe in user-centric design that scales.",
        "responsibilities": [
            "Create high-fidelity mockups for {context}.",
            "Build and maintain a consistent design system.",
            "Conduct usability testing sessions with real users.",
            "Collaborate with PMs and Devs on feasibility."
        ],
        "requirements": [
            "Expertise in Figma and Adobe Creative Suite.",
            "Portfolio showcasing strong UX thinking and visual craft.",
            "Knowledge of accessibility standards (WCAG).",
            "Ability to articulate design decisions clearly."
        ],
        "contexts": ["next-gen talent sourcing app", "employer branding dashboard", "personalized career roadmap"]
    },
    {
        "name": "Fullstack Development",
        "titles": ["Fullstack Engineer", "Senior Web Developer", "Founder's Representative Engineer"],
        "description": "Own features from end-to-end in our {context}. You will jump between frontend polish and backend architecture seamlessly.",
        "responsibilities": [
            "Develop full-lifecycle features for {context}.",
            "Optimize both client-side and server-side performance.",
            "Maintain code coverage and documentation.",
            "Provide technical support for production incidents."
        ],
        "requirements": [
            "Proficiency in modern frontend and backend stacks.",
            "Experience with cloud-native deployments.",
            "Strong problem-solving and rapid learning abilities.",
            "Experience in a fast-paced startup environment."
        ],
        "contexts": ["rapid prototyping incubator", "scalable e-learning platform", "social-driven job network"]
    },
    {
        "name": "Quality Assurance",
        "titles": ["Automation QA Engineer", "SDET", "Manual Test Specialist"],
        "description": "Ensure the highest quality for {context}. You will be the champion of stability and user trust.",
        "responsibilities": [
            "Develop automated test suites for {context}.",
            "Perform load and stress testing on critical services.",
            "Collaborate with devs to fix bugs before release.",
            "Define quality standards and reporting metrics."
        ],
        "requirements": [
            "Experience with Selenium, Cypress, or Playwright.",
            "Strong attention to detail and logical thinking.",
            "Knowledge of software testing life cycle (STLC).",
            "Familiarity with CI/CD and bug tracking tools."
        ],
        "contexts": ["mission-critical hiring workflow", "high-volume user registration", "global candidate database"]
    }
]

LOCATIONS = ["Hanoi, Vietnam", "Ho Chi Minh City, Vietnam", "Da Nang, Vietnam", "Remote (Global)", "Remote (Local)"]
JOB_TYPES = ["full-time", "full-time", "contract", "part-time", "internship"]
EXPERIENCE_LEVELS = ["entry", "mid", "mid", "senior", "senior"]

def login(email, password):
    print(f"Logging in as {email}...")
    response = requests.post(f"{BASE_URL}/auth/signin", json={
        "email": email,
        "password": password
    })
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            print("Login successful!")
            return data.get("token")
        else:
            print(f"Login failed: {data.get('message')}")
            return None
    else:
        print(f"Login failed with status code {response.status_code}")
        print(response.text)
        return None

def create_job(token, job_data):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"Creating job: {job_data['title']}...")
    response = requests.post(f"{BASE_URL}/jobs/", json=job_data, headers=headers)
    
    if response.status_code == 201:
        print(f"Successfully created job: {job_data['title']}")
        return True
    else:
        print(f"Failed to create job: {job_data['title']}")
        print(f"Status code: {response.status_code}")
        print(response.text)
        return False

def generate_36_jobs():
    jobs = []
    # 12 categories, each with 3 variations
    for category in CATEGORIES:
        for i in range(3):
            title = category["titles"][i % len(category["titles"])]
            context = category.get("contexts", ["modern recruitment"])[i % len(category.get("contexts", ["modern recruitment"]))]
            
            framework = category.get("frameworks", ["React"])[i % len(category.get("frameworks", ["React"]))]
            description = category["description"].format(context=context)
            if "{framework}" in description:
                description = description.format(framework=framework)
            
            responsibilities = []
            for r in category["responsibilities"]:
                # Provide both context and framework for formatting
                formatted_r = r.format(context=context, framework=framework)
                responsibilities.append(formatted_r)
            requirements = category["requirements"]
            benefits = [
                "Competitive base salary.",
                "Premium health insurance.",
                "Flexible work-from-home options.",
                "Professional training and certifications."
            ]
            
            location = random.choice(LOCATIONS)
            job_type = random.choice(JOB_TYPES)
            exp_level = random.choice(EXPERIENCE_LEVELS)
            
            # Adjust salary based on exp level
            if exp_level == "entry":
                s_min, s_max = 500 + random.randint(0, 500), 1000 + random.randint(0, 500)
            elif exp_level == "mid":
                s_min, s_max = 1200 + random.randint(0, 800), 2500 + random.randint(0, 1000)
            else: # senior
                s_min, s_max = 2800 + random.randint(0, 1200), 5000 + random.randint(0, 2000)
            
            jobs.append({
                "title": f"{title} ({i+1})",
                "description": description,
                "location": location,
                "jobType": job_type,
                "experienceLevel": exp_level,
                "salaryMin": s_min,
                "salaryMax": s_max,
                "responsibilities": responsibilities,
                "requirements": requirements,
                "benefits": benefits,
                "status": "published"
            })
    return jobs

def main():
    print("=== HustConnect Job Multi-Generator (36 Jobs) ===")
    email = input("Enter HR Email: ")
    password = getpass.getpass("Enter HR Password: ")
    
    token = login(email, password)
    
    if not token:
        return
    
    all_jobs = generate_36_jobs()
    print(f"Generated {len(all_jobs)} jobs list locally. Starting creation...")
    
    success_count = 0
    for job in all_jobs:
        if create_job(token, job):
            success_count += 1
            
    print(f"\nFinished! Successfully created {success_count} jobs out of {len(all_jobs)}.")

if __name__ == "__main__":
    main()
