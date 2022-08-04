import React, {useEffect, useReducer, useRef, createRef} from 'react';
import normalizeWheel from 'normalize-wheel'; 

const ScrollLoop = ( props ) => {
    const { children } = props;

    const copys = 3
    const childrenCopyRef =  useRef([...Array(copys)].map(() => createRef()))
    const childrenCopys = (() => {
        const temp = [];
        for(let copy = 0; copy < copys; copy++) {
            temp.push(
                <div 
                    className={`loop-items items-copy-${copy}`}
                    ref={childrenCopyRef.current[copy]}
                    key={copy}
                    style={{order: copy + 1}}
                >
                {
                    children.map( child => {
                        return child
                    })
                }
            </div>
            );
        }
        return temp
    })()

    const initialState = {
        offSetY: 0,
        childrenHeight: 0,
        order: []
    };
    const reducer = (state, action) => {
        switch (action.type) {
            case 'translateY':
                // When to change the translate, to create the looping effect:
                // The original children are beeing duplicated two times
                // This results in a total of 3 copys of children
                // Relative share of one copy: 33.3333%
                // Threshold to loop below 0.5 and above 1.5
                // Offset upper limit = 49.99995%
                // Offset lower limit = 16.6666%
                
                const pixelY = action.payload;

                let newOffSetY = pixelY * -1;
                let newOrder = state.order;
                const wheelDirection = (() => {
                    if(pixelY < 0) {
                        return "DOWN"
                    }
                    if(pixelY > 0){
                        return "UP"
                    }
                    if(pixelY === 0){
                        return "UNCHANGED"
                    }      
                })()
                const totalHeight = state.childrenHeight * copys;
                const relativeOffset = state.offSetY / totalHeight * 100 * -1;

                const changeFlexOrder = () => {
                    for(let copy = 0; copy < copys; copy++){
                        childrenCopyRef.current[copy].current.style.order = newOrder[copy]
                    }
                }

                if(wheelDirection === "UP" && relativeOffset > 49.99995) {
                    newOffSetY += state.childrenHeight

                    const tempA = newOrder.slice(0, 2);
                    const tempB = [newOrder[2], ...tempA];
                    newOrder = tempB;
                    changeFlexOrder()
  
                }
                if(wheelDirection === "DOWN" && relativeOffset < 16.6666) {
                    newOffSetY -= state.childrenHeight

                    const tempA = newOrder.slice(1, 3);
                    const tempB = [...tempA, newOrder[0]];
                    newOrder = tempB;
                    changeFlexOrder()
                }

                return {...state, offSetY: state.offSetY + newOffSetY, order: newOrder};
           
            case 'init':
                const height = childrenCopyRef.current[0].current.clientHeight;
                const order = []
                for(let i = 0; i < children.length; i++){
                    order[i] = i + 1;
                }

                return {...state, offSetY: -height, childrenHeight: height, order: order}
            default:
                throw new Error();
        } 
    }
    const [state, dispatch] = useReducer(reducer, initialState)

    const handleWheelInput = (event) => {
        event.preventDefault();

        const wheel = normalizeWheel(event); 
        const pixelY = wheel.pixelY;

        dispatch({type: 'translateY', payload: pixelY})
    }

    const handleTouchMove = (event) => {
        event.preventDefault();
        console.log(event)

    }

    const cssItemsWrapper = {
        transform: `translate3d(0px, ${state.offSetY}px, 0px)`,
        display: "flex",
        flexDirection: "column"
    }
    const cssScrollContainer = {
        height: `${state.childrenHeight}px`,
        overflow: "hidden"
    }
    
    useEffect( () => {
        dispatch({type: 'init'})

        if("ontouchstart" in document) {
            console.log("touch")
            document.addEventListener("touchmove", event => handleTouchMove(event))
        }
        
        document.addEventListener('onwheel' in document ? 'wheel' : 'onmousewheel' in document ? 'mousewheel' : 'DOMMouseScroll', event => handleWheelInput(event), false);
        return () => {
            document.removeEventListener('onwheel' in document ? 'wheel' : 'onmousewheel' in document ? 'mousewheel' : 'DOMMouseScroll', event => handleWheelInput(event), false);
        }
    },[])

    return (
        <div className="scroll-loop-container" style={cssScrollContainer}>
            <div className="items-wrapper" style={cssItemsWrapper}>
                {childrenCopys}
            </div>
        </div>
    )

}

export default ScrollLoop