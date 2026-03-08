import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2, Terminal, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CodeRunnerProps {
  code: string;
  language: string;
  readOnly?: boolean;
}

export default function CodeRunner({ code, language, readOnly }: CodeRunnerProps) {
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);

  const runCode = async () => {
    setRunning(true);
    setOutput(null);
    setHasError(false);

    try {
      const { data, error } = await supabase.functions.invoke("run-code", {
        body: { language, source_code: code },
      });

      if (error) throw error;
      if (data?.error && typeof data.error === "string") throw new Error(data.error);

      setOutput(data?.output || "No output");
      setHasError(!!data?.error);

      if (data?.simulated) {
        toast.info("Output simulated by AI", { description: "Actual execution may differ." });
      }
    } catch (e: any) {
      setOutput(e.message || "Execution failed");
      setHasError(true);
    }

    setRunning(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languageColors: Record<string, string> = {
    python: "bg-[hsl(48,80%,50%)]/10 text-[hsl(48,80%,35%)]",
    javascript: "bg-[hsl(48,90%,50%)]/10 text-[hsl(48,90%,35%)]",
    java: "bg-[hsl(15,70%,50%)]/10 text-[hsl(15,70%,35%)]",
    c: "bg-[hsl(210,60%,50%)]/10 text-[hsl(210,60%,35%)]",
    cpp: "bg-[hsl(210,70%,50%)]/10 text-[hsl(210,70%,35%)]",
    typescript: "bg-[hsl(210,80%,55%)]/10 text-[hsl(210,80%,40%)]",
    go: "bg-[hsl(195,60%,50%)]/10 text-[hsl(195,60%,35%)]",
    rust: "bg-[hsl(20,70%,45%)]/10 text-[hsl(20,70%,30%)]",
  };

  return (
    <div className="space-y-3">
      {/* Code display */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/50" />
            </div>
            <Badge className={cn("text-[10px]", languageColors[language] || "bg-muted text-muted-foreground")}>
              {language}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={copyCode}>
              {copied ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              className="h-7 px-3 text-xs gradient-primary text-primary-foreground"
              onClick={runCode}
              disabled={running}
            >
              {running ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <Play className="mr-1.5 h-3 w-3" />
              )}
              {running ? "Running..." : "Run"}
            </Button>
          </div>
        </div>
        <div className="p-4 max-h-[400px] overflow-auto">
          <pre className="text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
            {code.split("\n").map((line, i) => (
              <div key={i} className="flex">
                <span className="inline-block w-8 shrink-0 text-right pr-3 text-muted-foreground/50 select-none">{i + 1}</span>
                <span>{line}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>

      {/* Output */}
      {output !== null && (
        <div className={cn(
          "rounded-xl border overflow-hidden",
          hasError ? "border-destructive/30" : "border-success/30"
        )}>
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-medium",
            hasError ? "bg-destructive/5 text-destructive" : "bg-success/5 text-success"
          )}>
            <Terminal className="h-3 w-3" />
            Output
          </div>
          <div className="p-4 bg-card">
            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
