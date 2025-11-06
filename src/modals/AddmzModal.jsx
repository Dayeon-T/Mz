import { useState, useEffect } from 'react'
import ModalBlur from '../components/ModalBlur.jsx'
import Addtime from '../assets/addtime.svg?react'
import AddImage from '../assets/image.svg?react'

const inputstyle="h-8 bg-[#ECECEC] rounded-[20px] w-[31%] focus:outline-none px-4 focus:ring-1 ring-main/70 text-[18px] font-medium placeholder:font-medium placeholder:text-[18px]"
const timeinput='bg-[#ECECEC] flex-1 h-8 rounded-full text-center w-[45%] focus:outline-none px-4 focus:ring-1 ring-main/70 '

export default function AddmzModal({ onClose }){
    const [address, setAddress] = useState('')
    const [detailAddress, setDetailAddress] = useState('')
    const [zonecode, setZonecode] = useState('')
    const [timeMode, setTimeMode] = useState('everyday') // 'everyday' or 'daybyday'
    const [selectedDay, setSelectedDay] = useState(0) // 0=월, 1=화, 2=수, 3=목, 4=금, 5=토, 6=일
    const [step, setStep] = useState(1) // 1: 기본 정보, 2: 추가 정보
    
    // 매일 같은 시간 영업
    const [is24Hours, setIs24Hours] = useState(false)
    const [startHour, setStartHour] = useState('')
    const [startMinute, setStartMinute] = useState('')
    const [endHour, setEndHour] = useState('')
    const [endMinute, setEndMinute] = useState('')
    
    // 요일별 영업시간 (7일치)
    const [daySchedules, setDaySchedules] = useState(
        Array.from({ length: 7 }, () => ({
            isClosed: false,
            is24Hours: false,
            startHour: '',
            startMinute: '',
            endHour: '',
            endMinute: ''
        }))
    )

    const updateDaySchedule = (dayIndex, field, value) => {
        const newSchedules = [...daySchedules]
        newSchedules[dayIndex] = { ...newSchedules[dayIndex], [field]: value }
        setDaySchedules(newSchedules)
    }

    // 여러 필드를 한 번에 갱신하기 위한 헬퍼 (배치 업데이트로 값 유실 방지)
    const updateDayScheduleMany = (dayIndex, patch) => {
        setDaySchedules(prev => {
            const next = [...prev]
            next[dayIndex] = { ...prev[dayIndex], ...patch }
            return next
        })
    }

    useEffect(() => {
        // 다음 우편번호 스크립트 로드
        const script = document.createElement('script')
        script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
        script.async = true
        document.head.appendChild(script)

        return () => {
            // cleanup: 스크립트 제거
            if (script.parentNode) {
                script.parentNode.removeChild(script)
            }
        }
    }, [])

    const handleAddressSearch = () => {
        if (!window.daum) {
            console.error('다음 우편번호 API가 로드되지 않았습니다.')
            return
        }

        new window.daum.Postcode({
            oncomplete: function(data) {
                // 도로명 주소 우선, 없으면 지번 주소
                const addr = data.roadAddress || data.jibunAddress
                setZonecode(data.zonecode)
                setAddress(addr)
                // 상세주소 입력 필드로 포커스 이동
                document.getElementById('detail-address')?.focus()
            }
        }).open()
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && typeof onClose === 'function') {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    return(
        <div className='fixed inset-0 flex justify-center items-center px-10 pt-16 pb-10 z-50'>
            <ModalBlur onClick={onClose} />
            <div
                className='relative z-50 w-[1200px] h-[100%] pl-10 pr-20 pt-20 pb-10 bg-white rounded-[82px] shadow-[0px_0px_5px_10px_rgba(0,0,0,0.04)] overflow-y-auto box-border'
                onClick={(e) => e.stopPropagation()}
                role='dialog'
                aria-modal='true'
            >
                <button
                    type='button'
                    onClick={onClose}
                    aria-label='모달 닫기'
                    className='absolute top-6 right-6 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 text-2xl leading-none flex items-center justify-center'
                >
                    ×
                </button>
                <p className='text-2xl font-bold mb-6 ml-4'>맛집 등록</p>
                {step === 1 && (
                <div className='flex gap-10'>
                    
                        <form action="" className='text-black text-xl font-semibold'>
                            <div className='grid grid-cols-2 gap-16'>
                            <div className='flex flex-col gap-4'>
                            <div className='flex items-start '>
                                <label htmlFor="" className='mr-6 w-24 flex-shrink-0 text-right '>주소</label>
                                <div className='flex-1 flex flex-col gap-2'>
                                    <div className='flex gap-2'>
                                        <input 
                                        className={inputstyle + ' flex-1 placeholder:text-[18px]'} 
                                        type="text"
                                        value={address}
                                        placeholder="기본 주소"
                                        readOnly
                                    />
                                        <button
                                            type="button"
                                            onClick={handleAddressSearch}
                                            className='px-4 py-1 bg-sub text-white rounded-full hover:bg-red-500 transition-colors text-[16px] font-semibold'
                                        >
                                            주소 검색
                                        </button>
                                    </div>
                                    
                                    <input 
                                        id="detail-address"
                                        className={inputstyle+'placeholder:text-[18px]'}
                                        type="text"
                                        value={detailAddress}
                                        onChange={(e) => setDetailAddress(e.target.value)}
                                        placeholder="상세 주소"
                                    />
                                </div>
                            </div>
                            <div className='flex items-center'>
                                <label htmlFor="" className='mr-6 w-24 flex-shrink-0 text-right'>가게명</label>
                                <input className={inputstyle + ' flex-1'} type="text"/>
                            </div>
                            <div className='flex items-center'>
                                <label htmlFor="" className='mr-6 w-24 flex-shrink-0 text-right'>전화번호</label>
                                <div className='flex gap-2'>
                                    <input className={inputstyle} type="text" maxLength="3"/>
                                    <span>-</span>
                                    <input className={inputstyle} type="text" maxLength="4"/>
                                    <span>-</span>
                                    <input className={inputstyle} type="text" maxLength="4"/>
                                </div>
                            </div>
                            <div className='flex items-start'>
                                <label htmlFor="" className='mr-6 w-24 flex-shrink-0 text-right pt-2'>영업시간</label>
                                <div className='flex-1'>
                                    <div className='grid grid-cols-2 gap-4 mb-4 relative'>
                                        <div 
                                            className={`text-center text-[16px] p-2 cursor-pointer transition-colors ${
                                                timeMode === 'everyday' ? 'text-black font-semibold' : 'text-gray-400'
                                            }`}
                                            onClick={() => setTimeMode('everyday')}
                                        >
                                            매일 같은 시간 영업
                                        </div>
                                        <div 
                                            className={`text-center text-[16px] p-2 cursor-pointer transition-colors ${
                                                timeMode === 'daybyday' ? 'text-black font-semibold' : 'text-gray-400'
                                            }`}
                                            onClick={() => setTimeMode('daybyday')}
                                        >
                                            요일별로 다른 시간에 영업
                                        </div>
                                        {/* 애니메이션 바 */}
                                        <div 
                                            className='absolute bottom-0 h-1 bg-sub transition-all duration-300 ease-in-out'
                                            style={{
                                                left: timeMode === 'everyday' ? '0%' : '50%',
                                                width: 'calc(50% - 8px)',
                                                marginLeft: timeMode === 'everyday' ? '0' : '8px'
                                            }}
                                        />
                                    </div>
                                {timeMode === 'everyday' && (
                                <div id='everydaysame'>
                                    <div className='flex justify-end mb-2 mr-2'>
                                    <span className='text-black text-sm font-medium mr-2 '>24시간</span>
                                    <input 
                                        type="checkbox" 
                                        className='accent-sub outline-none'
                                        checked={is24Hours}
                                        onChange={(e) => {
                                            setIs24Hours(e.target.checked)
                                            if (e.target.checked) {
                                                setStartHour('00')
                                                setStartMinute('00')
                                                setEndHour('24')
                                                setEndMinute('00')
                                            }
                                        }}
                                    />
                                    </div>
                                    <div className='flex items-center gap-2 text-[16px]'>
                                        <span className='flex-shrink-0'>시작</span>
                                        <input 
                                            type="number" 
                                            className={timeinput} 
                                            placeholder="00" 
                                            min="0" 
                                            max="23"
                                            value={startHour}
                                            onChange={(e) => setStartHour(e.target.value)}
                                            disabled={is24Hours}
                                        />
                                        <span>:</span>
                                        <input 
                                            type="number" 
                                            className={timeinput} 
                                            placeholder="00" 
                                            min="0" 
                                            max="59"
                                            value={startMinute}
                                            onChange={(e) => setStartMinute(e.target.value)}
                                            disabled={is24Hours}
                                        />
                                        <span className='mx-2'>~</span>
                                        <span className='flex-shrink-0'>종료</span>
                                        <input 
                                            type="number" 
                                            className={timeinput} 
                                            placeholder="00" 
                                            min="0" 
                                            max="24"
                                            value={endHour}
                                            onChange={(e) => setEndHour(e.target.value)}
                                            disabled={is24Hours}
                                        />
                                        <span>:</span>
                                        <input 
                                            type="number" 
                                            className={timeinput} 
                                            placeholder="00" 
                                            min="0" 
                                            max="59"
                                            value={endMinute}
                                            onChange={(e) => setEndMinute(e.target.value)}
                                            disabled={is24Hours}
                                        />
                                    </div>
                                    <div className='flex py-4 items-center cursor-pointer'>
                                    <p className=' pr-4 text-black text-base font-semibold'>브레이크타임 추가 </p><Addtime/>
                                    </div>
                                </div>
                                )}
                                {timeMode === 'daybyday' && (
                                <div id='daybyday' className='text-base'>
                                    <div className='grid grid-cols-7 text-center mb-2 relative'>
                                        {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                                            <div 
                                                key={day}
                                                className={`p-2 cursor-pointer transition-colors ${
                                                    selectedDay === index ? 'text-black font-semibold' : 'text-gray-400'
                                                }`}
                                                onClick={() => setSelectedDay(index)}
                                            >
                                                {day}
                                            </div>
                                        ))}
                                        {/* 애니메이션 바 */}
                                        <div 
                                            className='absolute bottom-0 h-1 bg-sub transition-all duration-300 ease-in-out'
                                            style={{
                                                left: `${(selectedDay / 7) * 100}%`,
                                                width: 'calc(14.28% - 4px)',
                                                marginLeft: '2px'
                                            }}
                                        />
                                    </div>
                                    <div className='flex justify-end mb-2 mr-2'>
                                        <span className='text-black text-sm font-medium mr-2'>휴무일</span>
                                        <input 
                                            type="checkbox" 
                                            className='accent-sub outline-none mr-4'
                                            checked={daySchedules[selectedDay].isClosed}
                                            onChange={(e) => {
                                                const checked = e.target.checked
                                                if (checked) {
                                                    updateDayScheduleMany(selectedDay, { 
                                                        isClosed: true, 
                                                        is24Hours: false,
                                                        startHour: '',
                                                        startMinute: '',
                                                        endHour: '',
                                                        endMinute: ''
                                                    })
                                                } else {
                                                    updateDayScheduleMany(selectedDay, { isClosed: false })
                                                }
                                            }}
                                        />
                                        <span className='text-black text-sm font-medium mr-2'>24시간</span>
                                        <input 
                                            type="checkbox" 
                                            className='accent-sub outline-none'
                                            checked={daySchedules[selectedDay].is24Hours}
                                            onChange={(e) => {
                                                const checked = e.target.checked
                                                if (checked) {
                                                    updateDayScheduleMany(selectedDay, {
                                                        is24Hours: true,
                                                        isClosed: false,
                                                        startHour: '00',
                                                        startMinute: '00',
                                                        endHour: '24',
                                                        endMinute: '00'
                                                    })
                                                } else {
                                                    updateDayScheduleMany(selectedDay, { is24Hours: false })
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className='flex items-center gap-2 text-[16px]'>
                                        <span className='flex-shrink-0'>시작</span>
                                        <input 
                                            type="number" 
                                            className={timeinput} 
                                            placeholder="00" 
                                            min="0" 
                                            max="23"
                                            value={daySchedules[selectedDay].startHour}
                                            onChange={(e) => updateDaySchedule(selectedDay, 'startHour', e.target.value)}
                                            disabled={daySchedules[selectedDay].isClosed || daySchedules[selectedDay].is24Hours}
                                        />
                                        <span>:</span>
                                        <input 
                                            type="number" 
                                            className={timeinput} 
                                            placeholder="00" 
                                            min="0" 
                                            max="59"
                                            value={daySchedules[selectedDay].startMinute}
                                            onChange={(e) => updateDaySchedule(selectedDay, 'startMinute', e.target.value)}
                                            disabled={daySchedules[selectedDay].isClosed || daySchedules[selectedDay].is24Hours}
                                        />
                                        <span className='mx-2'>~</span>
                                        <span className='flex-shrink-0'>종료</span>
                                        <input 
                                            type="number" 
                                            className={timeinput} 
                                            placeholder="00" 
                                            min="0" 
                                            max="24"
                                            value={daySchedules[selectedDay].endHour}
                                            onChange={(e) => updateDaySchedule(selectedDay, 'endHour', e.target.value)}
                                            disabled={daySchedules[selectedDay].isClosed || daySchedules[selectedDay].is24Hours}
                                        />
                                        <span>:</span>
                                        <input 
                                            type="number" 
                                            className={timeinput} 
                                            placeholder="00" 
                                            min="0" 
                                            max="59"
                                            value={daySchedules[selectedDay].endMinute}
                                            onChange={(e) => updateDaySchedule(selectedDay, 'endMinute', e.target.value)}
                                            disabled={daySchedules[selectedDay].isClosed || daySchedules[selectedDay].is24Hours}
                                        />
                                    </div>
                                    <div className='flex py-4 items-center cursor-pointer'>
                                    <p className=' pr-4 text-black text-base font-semibold'>브레이크타임 추가 </p><Addtime/>
                                    </div>



                                </div>
                                )}
                                </div>
                            </div>
                            <div className='flex items-center'>
                                <label htmlFor="" className='mr-6 w-24 flex-shrink-0 text-right'>카테고리</label>
                                <input type="text" className={inputstyle + ' w-[100%]'} placeholder='카테고리를 입력하세요.'/>
                            </div>
                           </div>  
                           <div className='w-[100%] h-[100%]'>
                                <p className='mb-8'>가게 대표 이미지 등록</p>
                                <div className='bg-rose-200 rounded-[20px] h-[88%]  border-box flex items-center justify-center'>
                                    <AddImage/>
                                </div>
                            </div>
                          </div>
                                                    <div className='flex justify-end'>
                                                        <button
                                                                type='button'
                                                                onClick={() => setStep(2)}
                                                                className='w-44 h-16 px-10 py-4 bg-red-400 rounded-3xl text-white text-3xl font-semibold mt-12'
                                                        >다음</button>
                                                    </div>
                        </form>

                        
                   
                    
                                </div>
                                )}
                                <form action="" className={step === 2 ? 'grid grid-cols-3' : 'hidden'} id="additional-info">
                            
                                <div className='flex flex-col gap-8'>
                                    <p>포장이 가능한 식당인가요?</p>
                                    <p>포장이 가능한 식당인가요?</p>
                                    <p>포장이 가능한 식당인가요?</p>
                                    <p>포장이 가능한 식당인가요?</p>
                                    <p>포장이 가능한 식당인가요?</p>
                                </div>
                                <div className='flex flex-col gap-8'>
                                    <input type="checkbox" />
                                    <input type="checkbox" />
                                    <input type="checkbox" />
                                    <input type="checkbox" />
                                    <input type="checkbox" />
                                </div>
                            <div className='col-span-2 mt-8'>
                                <p>추가기재</p>
                                <input type="text"/>
                            </div>
                            <div className='col-span-1'></div>
                            
                        </form>
            </div>
              
        </div>
    )
}