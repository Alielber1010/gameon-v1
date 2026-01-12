"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface DialogOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

interface DialogContextType {
  alert: (message: string, title?: string) => Promise<void>
  confirm: (message: string, options?: DialogOptions) => Promise<boolean>
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<{
    open: boolean
    message: string
    title: string
    resolve: () => void
  } | null>(null)

  const [confirmState, setConfirmState] = useState<{
    open: boolean
    message: string
    title: string
    confirmText: string
    cancelText: string
    variant: 'default' | 'destructive'
    resolve: (value: boolean) => void
  } | null>(null)

  const alert = useCallback((message: string, title: string = 'Alert') => {
    return new Promise<void>((resolve) => {
      setAlertState({
        open: true,
        message,
        title,
        resolve,
      })
    })
  }, [])

  const confirm = useCallback(
    (
      message: string,
      options: DialogOptions = {}
    ): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setConfirmState({
          open: true,
          message,
          title: options.title || 'Confirm',
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          variant: options.variant || 'default',
          resolve,
        })
      })
    },
    []
  )

  const handleAlertClose = useCallback(() => {
    if (alertState) {
      alertState.resolve()
      setAlertState(null)
    }
  }, [alertState])

  const handleConfirm = useCallback(() => {
    if (confirmState) {
      confirmState.resolve(true)
      setConfirmState(null)
    }
  }, [confirmState])

  const handleCancel = useCallback(() => {
    if (confirmState) {
      confirmState.resolve(false)
      setConfirmState(null)
    }
  }, [confirmState])

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      
      {/* Alert Dialog */}
      <AlertDialog open={alertState?.open || false} onOpenChange={(open) => !open && handleAlertClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertState?.title || 'Alert'}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">
              {alertState?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAlertClose}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmState?.open || false} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmState?.title || 'Confirm'}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">
              {confirmState?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {confirmState?.cancelText || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={confirmState?.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {confirmState?.confirmText || 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}


