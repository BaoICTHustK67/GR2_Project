import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Trophy, Star, PartyPopper } from 'lucide-react'

interface CongratulationModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
}

export default function CongratulationModal({ isOpen, onClose, title }: CongratulationModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto w-screen">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 scale-95 translate-y-10"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-[#1A1C20] p-6 text-center align-middle shadow-xl transition-all relative">
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
                
                <div className="mt-4 mb-6 relative">
                   <div className="mx-auto w-24 h-24 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center animate-bounce">
                      <Trophy className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
                   </div>
                   <Star className="w-6 h-6 text-yellow-400 absolute top-0 right-[30%] animate-pulse" />
                   <PartyPopper className="w-6 h-6 text-purple-500 absolute bottom-0 left-[30%] animate-spin-slow" />
                </div>

                <Dialog.Title
                  as="h3"
                  className="text-2xl font-extrabold leading-6 text-gray-900 dark:text-white mb-2"
                >
                  Congratulations!
                </Dialog.Title>
                
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  You have completed the <span className="font-bold text-gray-900 dark:text-white">{title}</span> roadmap. This is a huge achievement!
                </p>

                <div className="mt-4">
                  <button
                    type="button"
                    className="btn w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-none shadow-lg hover:shadow-yellow-500/25 transition-all transform hover:-translate-y-0.5"
                    onClick={onClose}
                  >
                    Claim Your Victory
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
