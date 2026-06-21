// Reusable glassmorphism panel component
export default function GlassPanel({ children, style = {}, className = '', color = null, onClick }) {
  const glowStyle = color ? { boxShadow: `0 0 30px ${color}20, inset 0 0 30px ${color}05` } : {}
  return (
    <div
      className={`glass ${className}`}
      onClick={onClick}
      style={{
        padding: '24px',
        ...glowStyle,
        ...(color ? { borderColor: `${color}30` } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}
