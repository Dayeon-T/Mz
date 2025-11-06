import { useEffect, useMemo, useState } from 'react'
import Search from '../assets/search.svg?react'
export default function SearchBar({
  value = '',
  onChange,
  onSubmit,
  placeholder = '가게명, 주소, 카테고리로 검색...',
  delay = 300,
  className = ''
}) {
  const [inner, setInner] = useState(value)

  useEffect(() => {
    setInner(value)
  }, [value])

  const debouncedChange = useMemo(() => {
    let t
    return (v) => {
      clearTimeout(t)
      t = setTimeout(() => onChange?.(v), delay)
    }
  }, [onChange, delay])

  const handleChange = (e) => {
    const v = e.target.value
    setInner(v)
    debouncedChange(v)
  }

  const submit = () => {
    const v = inner?.trim?.() ?? ''
    if (onSubmit) onSubmit(v)
  }

  return (
    <div className={`ml-[20px] pt-[22px] pl-[12px] ${className} flex-1 relative`}>
      <input
        type="text"
        value={inner}
        onChange={handleChange}
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
        placeholder={placeholder}
        className="w-full h-[56px] rounded-l-[16px] bg-search-bg pl-20 text-[18px] focus:outline-none focus:ring-2 focus:ring-main/70 text-black placeholder:text-[#383838] text-xl"
      />
      <button type="button" onClick={submit} className="absolute top-[28px] left-6 p-1 rounded hover:opacity-80 focus:outline-none">
        <Search />
      </button>

    </div>
  )
}
