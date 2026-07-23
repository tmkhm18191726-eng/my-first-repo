interface Props {
  lines: string[]
}

export function SpeechBubble({ lines }: Props) {
  return (
    <div className="speech-bubble">
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
      <span className="speech-bubble-paw">🐾</span>
    </div>
  )
}
