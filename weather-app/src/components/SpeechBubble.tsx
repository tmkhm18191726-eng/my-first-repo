interface Props {
  lines: string[]
}

export function SpeechBubble({ lines }: Props) {
  return (
    <div className="speech-bubble">
      <span className="speech-bubble-quote">❝</span>
      <div className="speech-bubble-lines">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <span className="speech-bubble-heart">♥</span>
    </div>
  )
}
