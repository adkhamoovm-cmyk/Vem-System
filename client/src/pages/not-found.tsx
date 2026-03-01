import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="bg-card rounded-xl p-6 border border-border max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-404-title">404</h1>
        <p className="text-muted-foreground text-sm" data-testid="text-404-message">Sahifa topilmadi</p>
        <Link href="/dashboard">
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium" data-testid="button-go-home">
            Bosh sahifaga qaytish
          </button>
        </Link>
      </div>
    </div>
  );
}
