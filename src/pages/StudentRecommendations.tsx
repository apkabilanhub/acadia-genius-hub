import DashboardLayout from "@/components/DashboardLayout";
import { Sparkles, Lightbulb, TrendingUp, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const recommendations = [
  {
    title: "AI-Based Fake News Detection System",
    domain: "Artificial Intelligence",
    difficulty: "Advanced",
    trending: true,
    description: "Build a deep learning model using NLP to classify news articles as real or fake with explainability features.",
    tech: ["Python", "Transformers", "React", "FastAPI"],
  },
  {
    title: "Decentralized E-Voting Platform",
    domain: "Blockchain",
    difficulty: "Advanced",
    trending: true,
    description: "Create a secure, transparent voting system using Ethereum smart contracts with identity verification.",
    tech: ["Solidity", "React", "Node.js", "IPFS"],
  },
  {
    title: "Smart Waste Management IoT System",
    domain: "Internet of Things",
    difficulty: "Intermediate",
    trending: false,
    description: "Design IoT-enabled waste bins with fill-level sensors, route optimization, and a dashboard for municipalities.",
    tech: ["Arduino", "Python", "MQTT", "React"],
  },
  {
    title: "AI Resume Screener & Job Matcher",
    domain: "Machine Learning",
    difficulty: "Intermediate",
    trending: true,
    description: "Build an NLP pipeline that parses resumes, extracts skills, and matches candidates with job descriptions.",
    tech: ["Python", "SpaCy", "React", "PostgreSQL"],
  },
  {
    title: "Real-Time Sign Language Translator",
    domain: "Computer Vision",
    difficulty: "Advanced",
    trending: false,
    description: "Use MediaPipe and CNN to recognize sign language gestures in real-time and convert them to text/speech.",
    tech: ["Python", "TensorFlow", "MediaPipe", "React"],
  },
  {
    title: "Cybersecurity Vulnerability Scanner",
    domain: "Cybersecurity",
    difficulty: "Advanced",
    trending: true,
    description: "Automated web vulnerability scanner that detects SQL injection, XSS, and CSRF with detailed reports.",
    tech: ["Python", "Flask", "React", "Docker"],
  },
];

export default function StudentRecommendations() {
  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Project Recommendations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized project ideas based on your department, interests, and trending technologies
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {recommendations.map((rec) => (
            <div
              key={rec.title}
              className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-elegant hover:border-primary/30 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                {rec.trending && (
                  <Badge className="bg-success/10 text-success text-[10px] flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Trending
                  </Badge>
                )}
              </div>
              <h3 className="mt-3 font-heading text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {rec.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {rec.tech.map((t) => (
                  <span key={t} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">{rec.domain}</Badge>
                  <Badge variant="outline" className="text-[10px]">{rec.difficulty}</Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-primary">
                  Use Idea <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
