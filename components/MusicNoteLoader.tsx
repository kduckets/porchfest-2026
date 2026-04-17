export function MusicNoteLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {["♩", "♪", "♫", "♬"].map((note, i) => (
        <span
          key={i}
          className="text-sage text-2xl animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        >
          {note}
        </span>
      ))}
    </div>
  );
}
