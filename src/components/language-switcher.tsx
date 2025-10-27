'use client'
import { useState } from 'react'
import { useTheme } from './theme-provider'
import { Globe } from 'lucide-react'

interface SettingsButtonProps {
  onClockSettingsOpen?: () => void
}

export function SettingsButton({ onClockSettingsOpen }: SettingsButtonProps) {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        {/* Settings button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group w-12 h-12 ${theme === 'dark' ? 'bg-white border-white/20 text-black hover:bg-gray-100' : 'bg-black border-black/20 text-white hover:bg-gray-800'} rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${
            isOpen ? 'rotate-45' : ''
          }`}
          aria-label="Settings"
        >
          <svg
            className={`w-5 h-5 transition-all duration-300 ${theme === 'dark' ? 'text-black group-hover:text-gray-700' : 'text-white group-hover:text-gray-200'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {/* Backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Theme circle */}
        <button
          onClick={toggleTheme}
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
            pointerEvents: isOpen ? 'auto' : 'none',
            transitionDelay: isOpen ? '100ms' : '0ms',
          }}
          className={`absolute bottom-16 right-1 w-10 h-10 ${theme === 'dark' ? 'bg-white border-white/20 hover:bg-gray-100' : 'bg-black border-black/20 hover:bg-gray-800'} rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-50 transition-all duration-300 ease-out`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg
              className="w-4 h-4 text-black hover:text-gray-700 transition-colors duration-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-white hover:text-gray-200 transition-colors duration-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        {/* Clock Configuration circle */}
        <button
          onClick={() => {
            onClockSettingsOpen?.()
            setIsOpen(false)
          }}
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
            pointerEvents: isOpen ? 'auto' : 'none',
            transitionDelay: isOpen ? '200ms' : '0ms',
          }}
          className={`absolute bottom-28 right-1 w-10 h-10 ${theme === 'dark' ? 'bg-white border-white/20 hover:bg-gray-100' : 'bg-black border-black/20 hover:bg-gray-800'} rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-50 transition-all duration-300 ease-out`}
          aria-label="Clock configuration"
        >
          <Globe className={`w-4 h-4 ${theme === 'dark' ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-200'} transition-colors duration-300`} />
        </button>

      </div>
    </div>
  )
}
