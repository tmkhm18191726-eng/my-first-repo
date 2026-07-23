interface Props {
  lines: string[]
}

export function SpeechBubble({ lines }: Props) {
  return (
    <div className="speech-bubble">
      <span className="speech-bubble-badge">♥</span>
      <div className="speech-bubble-lines">
        {lines.map((line, i) => (
          <p key={i} className={i === 0 ? 'speech-bubble-lead' : undefined}>
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
