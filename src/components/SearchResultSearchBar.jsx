import { useState, useEffect } from 'react'
import Search from '../assets/search.svg?react'
import Deleter from '../assets/deleter.svg?react'
import Filter from '../assets/filter.svg?react'
export default function SearchResultSearchBar({ value = '', onSubmit }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])

  const submit = () => onSubmit?.(text.trim())

  return (
    <div className="relative w-full pr-[300px]">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="검색어를 입력하세요"
        className="w-full h-[56px] rounded-[16px] bg-search-bg pl-16 text-[18px] focus:outline-none focus:ring-2 focus:ring-main/70 text-black placeholder:text-[#383838] text-xl"
      />
      <button type="button" onClick={submit} className="absolute top-2 left-3 p-1 rounded hover:opacity-80 focus:outline-none">
              <Search />
      </button>
       <button type="button" onClick={submit} className="absolute top-[12px] right-[380px] p-1 rounded hover:opacity-80 focus:outline-none">
              <Deleter />
      </button>
       <button type="button" onClick={submit} className="absolute top-[12px] right-[320px] p-1 rounded hover:opacity-80 focus:outline-none">
              <Filter />
      </button>
    </div>
  )
}