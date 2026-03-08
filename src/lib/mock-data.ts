export type ProjectStatus = "submitted" | "under_review" | "revision_requested" | "approved" | "rejected";
export type UserRole = "student" | "faculty" | "admin";

export interface Project {
  id: string;
  title: string;
  abstract: string;
  domain: string;
  methodology: string;
  techStack: string[];
  teamMembers: string[];
  guideName: string;
  status: ProjectStatus;
  submittedAt: string;
  updatedAt: string;
  studentName: string;
  department: string;
  innovationScore?: number;
  difficultyScore?: number;
  aiGrade?: number;
  facultyGrade?: number;
  files: { name: string; type: string; size: string }[];
  versions: number;
}

export interface EvaluationCriteria {
  name: string;
  maxScore: number;
  score: number;
  description: string;
}

export interface DepartmentStat {
  name: string;
  projects: number;
  evaluated: number;
  avgScore: number;
}

export const mockProjects: Project[] = [
  {
    id: "PRJ-001",
    title: "AI-Powered Smart Traffic Management System",
    abstract: "A real-time traffic management system using computer vision and reinforcement learning to optimize traffic flow at intersections, reducing average wait times by 35%.",
    domain: "Artificial Intelligence",
    methodology: "Agile with YOLO object detection and Q-learning",
    techStack: ["Python", "TensorFlow", "OpenCV", "React", "FastAPI"],
    teamMembers: ["Aarav Patel", "Priya Sharma", "Rohan Mehta"],
    guideName: "Dr. Ananya Krishnan",
    status: "approved",
    submittedAt: "2026-02-15",
    updatedAt: "2026-03-01",
    studentName: "Aarav Patel",
    department: "Computer Science",
    innovationScore: 92,
    difficultyScore: 88,
    aiGrade: 87,
    facultyGrade: 90,
    files: [
      { name: "project_report.pdf", type: "PDF", size: "4.2 MB" },
      { name: "presentation.pptx", type: "PPT", size: "12.8 MB" },
      { name: "source_code.zip", type: "ZIP", size: "56 MB" },
      { name: "demo_video.mp4", type: "Video", size: "180 MB" },
    ],
    versions: 3,
  },
  {
    id: "PRJ-002",
    title: "Blockchain-Based Academic Certificate Verification",
    abstract: "A decentralized system for issuing and verifying academic certificates using Ethereum smart contracts, eliminating certificate fraud.",
    domain: "Blockchain",
    methodology: "Waterfall with Solidity smart contracts",
    techStack: ["Solidity", "React", "Node.js", "IPFS", "Ethereum"],
    teamMembers: ["Sneha Gupta", "Vikram Singh"],
    guideName: "Prof. Rajesh Kumar",
    status: "under_review",
    submittedAt: "2026-02-20",
    updatedAt: "2026-02-28",
    studentName: "Sneha Gupta",
    department: "Information Technology",
    innovationScore: 85,
    difficultyScore: 78,
    aiGrade: 82,
    files: [
      { name: "project_report.pdf", type: "PDF", size: "3.8 MB" },
      { name: "presentation.pptx", type: "PPT", size: "8.5 MB" },
      { name: "source_code.zip", type: "ZIP", size: "34 MB" },
    ],
    versions: 2,
  },
  {
    id: "PRJ-003",
    title: "IoT-Based Smart Agriculture Monitoring System",
    abstract: "An IoT solution using soil sensors, weather APIs, and ML models to provide real-time crop health monitoring and irrigation recommendations.",
    domain: "Internet of Things",
    methodology: "Prototyping with Arduino and MQTT",
    techStack: ["Arduino", "Python", "MQTT", "React Native", "MongoDB"],
    teamMembers: ["Kavya Reddy", "Arjun Das", "Neha Iyer"],
    guideName: "Dr. Meera Nair",
    status: "submitted",
    submittedAt: "2026-03-05",
    updatedAt: "2026-03-05",
    studentName: "Kavya Reddy",
    department: "Electronics & Communication",
    files: [
      { name: "project_report.pdf", type: "PDF", size: "5.1 MB" },
      { name: "source_code.zip", type: "ZIP", size: "22 MB" },
    ],
    versions: 1,
  },
  {
    id: "PRJ-004",
    title: "Cybersecurity Threat Detection Using Deep Learning",
    abstract: "A network intrusion detection system using LSTM autoencoders to identify zero-day attacks with 97% accuracy on the CICIDS2017 dataset.",
    domain: "Cybersecurity",
    methodology: "Research-based with LSTM and autoencoders",
    techStack: ["Python", "PyTorch", "Scikit-learn", "Flask", "Docker"],
    teamMembers: ["Aditya Joshi"],
    guideName: "Dr. Ananya Krishnan",
    status: "revision_requested",
    submittedAt: "2026-02-10",
    updatedAt: "2026-02-25",
    studentName: "Aditya Joshi",
    department: "Computer Science",
    innovationScore: 78,
    difficultyScore: 91,
    aiGrade: 75,
    files: [
      { name: "project_report.pdf", type: "PDF", size: "6.3 MB" },
      { name: "presentation.pptx", type: "PPT", size: "15 MB" },
      { name: "source_code.zip", type: "ZIP", size: "128 MB" },
    ],
    versions: 2,
  },
  {
    id: "PRJ-005",
    title: "Natural Language Processing Chatbot for Student Counseling",
    abstract: "An AI chatbot using transformer models to provide mental health support and academic guidance, achieving 89% user satisfaction.",
    domain: "Artificial Intelligence",
    methodology: "Agile with fine-tuned BERT",
    techStack: ["Python", "Hugging Face", "React", "PostgreSQL", "Docker"],
    teamMembers: ["Ishaan Malhotra", "Divya Sharma"],
    guideName: "Prof. Sanjay Verma",
    status: "approved",
    submittedAt: "2026-01-28",
    updatedAt: "2026-02-18",
    studentName: "Ishaan Malhotra",
    department: "Computer Science",
    innovationScore: 88,
    difficultyScore: 82,
    aiGrade: 85,
    facultyGrade: 88,
    files: [
      { name: "project_report.pdf", type: "PDF", size: "4.7 MB" },
      { name: "presentation.pptx", type: "PPT", size: "10 MB" },
      { name: "source_code.zip", type: "ZIP", size: "45 MB" },
      { name: "demo_video.mp4", type: "Video", size: "220 MB" },
    ],
    versions: 4,
  },
  {
    id: "PRJ-006",
    title: "Augmented Reality Campus Navigation App",
    abstract: "A mobile AR application that helps new students navigate the campus using real-time 3D overlays and indoor positioning.",
    domain: "Augmented Reality",
    methodology: "Scrum with ARCore and Unity",
    techStack: ["Unity", "C#", "ARCore", "Firebase", "Kotlin"],
    teamMembers: ["Tanvi Desai", "Rahul Nair", "Pooja Kaur"],
    guideName: "Dr. Meera Nair",
    status: "submitted",
    submittedAt: "2026-03-02",
    updatedAt: "2026-03-02",
    studentName: "Tanvi Desai",
    department: "Information Technology",
    files: [
      { name: "project_report.pdf", type: "PDF", size: "3.2 MB" },
      { name: "source_code.zip", type: "ZIP", size: "89 MB" },
    ],
    versions: 1,
  },
];

export const defaultEvaluationCriteria: EvaluationCriteria[] = [
  { name: "Innovation & Originality", maxScore: 20, score: 0, description: "Novel approach, unique problem-solving" },
  { name: "Technical Complexity", maxScore: 25, score: 0, description: "Architecture, algorithms, tech stack depth" },
  { name: "Documentation Quality", maxScore: 15, score: 0, description: "Report clarity, structure, references" },
  { name: "Implementation Quality", maxScore: 25, score: 0, description: "Code quality, testing, deployment" },
  { name: "Real-World Impact", maxScore: 15, score: 0, description: "Practical applicability, scalability" },
];

export const departmentStats: DepartmentStat[] = [
  { name: "Computer Science", projects: 45, evaluated: 38, avgScore: 82 },
  { name: "Information Technology", projects: 32, evaluated: 25, avgScore: 78 },
  { name: "Electronics & Comm.", projects: 28, evaluated: 22, avgScore: 75 },
  { name: "Mechanical Engineering", projects: 18, evaluated: 15, avgScore: 71 },
  { name: "Data Science", projects: 22, evaluated: 19, avgScore: 85 },
];

export const monthlySubmissions = [
  { month: "Sep", count: 12 },
  { month: "Oct", count: 24 },
  { month: "Nov", count: 38 },
  { month: "Dec", count: 52 },
  { month: "Jan", count: 68 },
  { month: "Feb", count: 85 },
  { month: "Mar", count: 42 },
];

export const vivaQuestions = [
  { question: "Explain the core architecture of your system and justify your technology choices.", difficulty: "Medium" },
  { question: "What is the time complexity of your main algorithm? How does it scale with larger datasets?", difficulty: "Hard" },
  { question: "How did you handle edge cases in your implementation?", difficulty: "Medium" },
  { question: "What security measures have you implemented to protect user data?", difficulty: "Hard" },
  { question: "Describe the testing strategy you followed. What test coverage did you achieve?", difficulty: "Easy" },
  { question: "How would you deploy this system in a production environment?", difficulty: "Medium" },
  { question: "What are the limitations of your current approach and how would you address them?", difficulty: "Easy" },
  { question: "Compare your approach with existing solutions. What makes yours better?", difficulty: "Hard" },
];

export function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case "submitted": return "bg-info/10 text-info";
    case "under_review": return "bg-warning/10 text-warning";
    case "revision_requested": return "bg-destructive/10 text-destructive";
    case "approved": return "bg-success/10 text-success";
    case "rejected": return "bg-destructive/10 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
}

export function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case "submitted": return "Submitted";
    case "under_review": return "Under Review";
    case "revision_requested": return "Revision Requested";
    case "approved": return "Approved";
    case "rejected": return "Rejected";
    default: return status;
  }
}
