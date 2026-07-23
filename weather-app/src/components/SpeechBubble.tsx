interface Props {
  message: string
}

export function SpeechBubble({ message }: Props) {
  return (
    <div className="speech-bubble">
      <p>{message}</p>
    </div>
  )
}
