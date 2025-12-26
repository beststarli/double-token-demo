import React from 'react'

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

// Lightweight Link fallback for non-Next environments (Vite, CRA, etc.)
export default function Link({ href, children, ...props }: Props) {
    return (
        <a href={href} {...props}>
            {children}
        </a>
    )
}
