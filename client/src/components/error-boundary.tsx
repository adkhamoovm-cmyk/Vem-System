import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

function getLocaleText(key: string): string {
  const locale = (typeof localStorage !== "undefined" && localStorage.getItem("vem-locale")) || "uz";
  const texts: Record<string, Record<string, string>> = {
    errorOccurred: { uz: "Xatolik yuz berdi", ru: "Произошла ошибка", en: "An error occurred", es: "Ocurrió un error", tr: "Bir hata oluştu" },
    reloadPage: { uz: "Sahifani qayta yuklang", ru: "Перезагрузите страницу", en: "Please reload the page", es: "Recarga la página", tr: "Sayfayı yeniden yükleyin" },
    reload: { uz: "Qayta yuklash", ru: "Перезагрузить", en: "Reload", es: "Recargar", tr: "Yeniden Yükle" },
  };
  return texts[key]?.[locale] || texts[key]?.["uz"] || key;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 border border-border max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-destructive text-xl">!</span>
            </div>
            <h2 className="text-foreground font-bold text-lg">{getLocaleText("errorOccurred")}</h2>
            <p className="text-muted-foreground text-sm">{getLocaleText("reloadPage")}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
              data-testid="button-reload-page"
            >
              {getLocaleText("reload")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
