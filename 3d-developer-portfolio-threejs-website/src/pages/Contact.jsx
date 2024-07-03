import React, { useRef, useState } from 'react'
import emailjs from '@emailjs/browser'

const Contact = () => {
  const formRef = useRef()

  const [form,setForm] = useState({name:'',email:"",message:''})
  const [isLoading,setIsLoading] = useState(false)

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value})

  }
  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)

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
      // TODO: Hide an alert

      setForm({name: "", email: '', message: ''})
    }).catch((error) => {
      setIsLoading(false);
console.log(error)
// TODO: Show error message
    })
  }
  const handleFocus = () => {}
  const handleBlur = () => {}

  return (
   <section className='relative flex lg:flex-row flex-col max-container'>
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
   </section>
  )
}

export default Contact