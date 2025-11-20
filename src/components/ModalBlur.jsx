export default function ModalBlur({ onClick }){
    return(
        <div
            className="bg-black/5 backdrop-blur-md w-full h-full fixed top-0 left-0 flex items-center justify-center z-40"
            onClick={onClick}
            aria-label="모달 배경"
        />
    )
}