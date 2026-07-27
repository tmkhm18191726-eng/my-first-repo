interface Props {
  lines: string[]
  photoUrl: string
}

export function SpeechBubble({ lines, photoUrl }: Props) {
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
      <div
        className="speech-bubble-photo"
        style={{ backgroundImage: `url(${photoUrl})` }}
        role="img"
        aria-label="思い出の写真"
      >
        <span aria-hidden="true">♡</span>
      </div>
    </div>
  )
}
