import React, { Suspense, useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import Fox from '../models/Fox'
import Loader from '../components/Loader'
import { Canvas } from '@react-three/fiber'
import useAlert from '../hooks/useAlert'
import Alert from '../components/Alert'

const Contact = () => {
  const formRef = useRef()

  const {alert,showAlert,hideAlert} = useAlert()

  const [form,setForm] = useState({name:'',email:"",message:''})
  const [isLoading,setIsLoading] = useState(false)
  const [currentAnimation,setCurrentAnimation] = useState('idle')

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value})

  }
  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)
    setCurrentAnimation('hit')

    emailjs.send(import.meta.env.VITE_APP_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID,
      {
        from_name: form.name,
        to_name: "Wasif",
        from_email: form.email,
        to_email: 'wasifraza909@gmail.com',
        message: form.message,
      },
      import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY

    ).then(() => {
      setIsLoading(false);
      // TODO: Show success message
      showAlert({show: true, text: "Message sent successfully!", type: 'success'})
      // TODO: Hide an alert

      setTimeout(() => {
        setCurrentAnimation('idle')
        setForm({name: "", email: '', message: ''})
      },[3000])

    }).catch((error) => {
      setIsLoading(false);
    setCurrentAnimation('idle')

console.log(error)
showAlert({show: true, text: "I didn't receive your message", type: 'danger'})

// TODO: Show error message
    })
  }
  const handleFocus = () => {
    setCurrentAnimation('walk')
  }
  const handleBlur = () => {
    setCurrentAnimation('idle')
  }

  return (
   <section className='relative flex lg:flex-row flex-col max-container lg:h-[100vh] h-full'>
    {alert.show && <Alert {...alert}/>}
    
    <div className='flex-1 min-w-[50%] flex flex-col'>
      <h1 className='head-text'>Get in touch</h1>

      <form action="" className="w-full flex flex-col gap-7 mt-14" onSubmit={handleSubmit}>
        <label htmlFor="" className="text-black-500 font-semibold">
          Name
          <input type='text' name='name' className='input' placeholder='John' required value={form.name} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur}/>
        </label>
        <label htmlFor="" className="text-black-500 font-semibold">
          Name
          <input type='email' name='email' className='input' placeholder='john@gmail.com' required value={form.email} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur}/>
        </label>
        <label htmlFor="" className="text-black-500 font-semibold">
          Your Message
          <textarea name='message' className='textarea' placeholder='Let me know how I can hellp you!' rows={4} required value={form.message} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur}/>
        </label>

        <button disabled={isLoading} type="submit" className='btn' onFocus={handleFocus} onBlur={handleBlur}>
{isLoading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>

    <div className="lg:w-1/2 w-full lg:h-auto md:h-[550px] h-[350px]">
    <Canvas camera={{
      position: [0,0,5],
      fov: 75,
      near: 0.1,
      far: 1000,
    }}>
      <Suspense fallback={<Loader/>}>
      <directionalLight position={[0, 0, 1]} intensity={2.5} />
        <ambientLight intensity={0.5} />
        <Fox currentAnimation={currentAnimation}  position={[0.5,0.35,0]} rotation={[12.6,-0.6,0]} scale={[0.5,0.5,0.5]}/>
      </Suspense>

    </Canvas>
    </div>
   </section>
  )
}

export default Contact