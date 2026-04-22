export function PromiseHealthPlanView() {
  return (
    <div className="flex h-screen flex-col">
      <iframe
        src="/mma-tracker/promise-v8-dashboard.html"
        className="flex-1 w-full border-0"
        title="Promise Health Plan — MRF Rate Analysis v8"
        allowFullScreen
      />
    </div>
  );
}
