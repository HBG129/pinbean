import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };

export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f6f3ee] dark:bg-[#1c1a17] p-8">
          <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-lg dark:bg-stone-800">
            <p className="text-lg font-bold text-red-500">出错了</p>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              {this.state.error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-orange-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
