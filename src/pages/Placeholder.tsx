export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
      <p className="text-text-secondary text-sm mt-1">
        This page is coming soon.
      </p>
    </div>
  );
}
