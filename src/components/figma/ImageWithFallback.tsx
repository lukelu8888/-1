import React, { useState } from 'react'

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  return didError ? (
    <div
      className={`overflow-hidden bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
      role="img"
      aria-label={alt}
    >
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_46%,#eef2f7_100%)] px-3">
        <div className="flex h-16 w-24 items-center justify-center rounded-sm border border-gray-200 bg-white shadow-sm">
          <span className="max-w-[5rem] text-center text-[10px] font-bold uppercase leading-3 text-gray-500">
            {alt || 'Product'}
          </span>
        </div>
      </div>
    </div>
  ) : (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
