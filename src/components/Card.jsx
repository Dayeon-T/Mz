import StoreList from "./Storelist"

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-tr-[100px] box-border h-screen ${className}`}>
      {children}
      
      <StoreList />
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