import StoreList from "./Storelist"

export function Card({ children, className = "", restaurants }) {
  return (
    <div className={`bg-white rounded-tr-[100px] h-[100%] ${className}`}>
      {children}

      <StoreList restaurants={restaurants} />
    </div>
  )
}

export function Container({ children, className = "" }) {
  return (
    <div className={`pl-[40px] pt-[40px] ${className}`}>
      {children}
    </div>
  )
}