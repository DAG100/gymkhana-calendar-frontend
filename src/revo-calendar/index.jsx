import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import helperFunctions from "./helpers/functions";
import translations from "./helpers/translations";
import { CHEVRON_ICON_SVG, CLOCK_ICON_SVG, DETAILS_ICON_SVG, SIDEBAR_ICON_SVG } from "./helpers/consts";
import { ThemeProvider } from "styled-components";
import { Calendar, CloseDetail, CloseSidebar, Day, DayButton, Details, Event, Inner, MonthButton, Sidebar, } from "./styles";
// -1 = animate closing | 0 = nothing | 1 = animate opening.
let animatingSidebar = 0;
let animatingDetail = 0;
/*
changes made to the original calendar
event:
  - add event
  - approve/disapprove event
    - disapprove -> shown to coordies?
  - delete/cancel event
  - conditional displaay of these buttons depending
  on a "profile" prop
event component:
  - clicking on it -> details expand
  - approve/disapprove/cancel located *above* details
*/

const UserContext = createContext({user:"user", organisation:""})

const RevoCalendar = ({ 
	style = {}, 
	className = "", 
	events = [], 
	highlightToday = true, 
	lang = "en", 
	primaryColor = "#4F6995", 
	secondaryColor = "#c4dce9", 
	todayColor = "#3B3966", 
	textColor = "#333333", 
	indicatorColor = "orange", 
	animationSpeed = 300, 
	sidebarWidth = 180, 
	detailWidth = 280, 
	showDetailToggler = true, 
	detailDefault = true, 
	showSidebarToggler = true, 
	sidebarDefault = true, 
	onePanelAtATime = false, 
	allowDeleteEvent = false, 
	openDetailsOnDateSelection = true, 
	timeFormat24 = true, 
	showAllDayLabel = false, 
	detailDateFormat = "DD/MM/YYYY", 
	languages = translations, 
	date = new Date(), 
	dateSelected = () => { }, 
	eventSelected = () => { }, 
	addEvent = () => { }, 
	deleteEvent = () => { },
}) => {
    // Transform any passed color format into rgb.
    const primaryColorRGB = helperFunctions.getRGBColor(primaryColor);
    const secondaryColorRGB = helperFunctions.getRGBColor(secondaryColor);
    const todayColorRGB = helperFunctions.getRGBColor(todayColor);
    const indicatorColorRGB = helperFunctions.getRGBColor(indicatorColor);
    const textColorRGB = helperFunctions.getRGBColor(textColor);
    const calendarRef = useRef(null);
    
    // Grab user and organisation from context
    const {user, organisation} = useContext(UserContext)
    
    //set event add permission
    const allowAddEvent = (["coordi", "gensec", "president"].indexOf(user) !== -1)
    // Get calendar size hook.
    function useCalendarWidth() {
        const [size, setSize] = useState(0);
        useEffect(() => {
            function updateSize() {
                if (calendarRef.current != null) {
                    setSize(calendarRef.current.offsetWidth);
                }
            }
            if (typeof window !== "undefined")
                window.addEventListener("resize", updateSize);
            updateSize();
            return () => window.removeEventListener("resize", updateSize);
        }, [calendarRef.current]);
        return size;
    }
    const calendarWidth = useCalendarWidth();
    // If calendar width can't fit both panels, force one panel at a time.
    if (calendarWidth <= 320 + sidebarWidth + detailWidth) {
        onePanelAtATime = true;
        // If both sidebar and detail panels are set to be open by default, sidebar will have priority.
        if (sidebarDefault && detailDefault)
            detailDefault = false;
    }
    // In order to make it responsible, panels will float on top of calendar on low res.
    const floatingPanels = calendarWidth <= 320 + sidebarWidth || calendarWidth <= 320 + detailWidth;
    // If, with the current setting, the sidebar or detail panels won't fit the screen, make them smaller.
    sidebarWidth = calendarWidth < sidebarWidth + 50 ? calendarWidth - 50 : sidebarWidth;
    detailWidth = calendarWidth < detailWidth + 50 ? calendarWidth - 50 : detailWidth;
    // Use today as default selected date if passed date is invalid.
    if (!helperFunctions.isValidDate(date)) {
        console.log("The passed date prop is invalid");
        date = new Date();
    }
    // Set initial state.
    const [currentDay, setDay] = useState(date.getDate());
    const [currentMonth, setMonth] = useState(date.getMonth());
    const [currentYear, setYear] = useState(date.getFullYear());
    const [sidebarOpen, setSidebarState] = useState(sidebarDefault);
    const [detailsOpen, setDetailsState] = useState(detailDefault);
    // Give parent component the current selected calendar day.
    useEffect(() => {
        dateSelected({
            day: currentDay,
            month: currentMonth,
            year: currentYear,
        });
    }, [currentDay, currentMonth, currentYear]);
    // Close details if can't fit it anymore after resizing.
    useEffect(() => {
        if (sidebarOpen && detailsOpen && calendarWidth <= 320 + sidebarWidth + detailWidth) {
            animatingDetail = -1;
            setDetailsState(false);
        }
    }, [calendarWidth]);
    /***********************
     * CALENDAR COMPONENTS *
     ***********************/
    function CalendarSidebar() {
        function prevYear() {
            setYear(currentYear - 1);
        }
        function nextYear() {
            setYear(currentYear + 1);
        }
        // Make sure no animation will run on next re-render.
        function animationEnd() {
            animatingSidebar = 0;
        }
        function toggleSidebar() {
            animatingSidebar = sidebarOpen ? -1 : 1;
            setSidebarState(!sidebarOpen);
            // Force details to close if onepanelatatime is true.
            if (animatingSidebar === 1 && onePanelAtATime && detailsOpen) {
                animatingDetail = -1;
                setDetailsState(false);
            }
        }
        function ChevronButton({ angle, color, action, ariaLabel, }) {
            return (<button onClick={action} aria-label={ariaLabel}>
          <svg aria-hidden="true" focusable="false" width="1em" height="1em" style={{ transform: `rotate(${angle}deg)` }} preserveAspectRatio="xMidYMid meet" viewBox="0 0 8 8">
            <path d={CHEVRON_ICON_SVG} fill={color}/>
            <rect x="0" y="0" width="8" height="8" fill="rgba(0, 0, 0, 0)"/>
          </svg>
        </button>);
        }
        return (<>
        <Sidebar animatingIn={animatingSidebar === 1} animatingOut={animatingSidebar === -1} sidebarOpen={sidebarOpen} onAnimationEnd={animationEnd}>
          <div>
            <ChevronButton angle={90} color={secondaryColorRGB} action={prevYear} ariaLabel={languages[lang].previousYear}/>
            <span>{currentYear}</span>
            <ChevronButton angle={270} color={secondaryColorRGB} action={nextYear} ariaLabel={languages[lang].nextYear}/>
          </div>
          <div>
            <ul>
              {languages[lang].months.map((month, i) => {
                return (<li key={i}>
                    <MonthButton current={i === currentMonth} onClick={() => setMonth(i)}>
                      {month}
                    </MonthButton>
                  </li>);
            })}
            </ul>
          </div>
        </Sidebar>
        {showSidebarToggler && (<CloseSidebar onClick={toggleSidebar} animatingIn={animatingSidebar === 1} animatingOut={animatingSidebar === -1} sidebarOpen={sidebarOpen} aria-label={languages[lang].toggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill={secondaryColorRGB} d={SIDEBAR_ICON_SVG}/>
            </svg>
          </CloseSidebar>)}
      </>);
    }
    function CalendarInner() {
        // Get list of days on each month accounting for leap years.
        const daysInMonths = helperFunctions.isLeapYear(currentYear);
        const days = [];
        for (let index = 1; index <= daysInMonths[currentMonth]; index++) {
            var isToday = helperFunctions.isToday(index, currentMonth, currentYear);
            var highlight = isToday && highlightToday;
            var hasEvent = false;
            for (let indexEvent = 0; indexEvent < events.length; indexEvent++) {
                const currentDate = new Date(currentYear, currentMonth, index);
                // Take out time from passed timestamp in order to compare only date
                var tempDate = new Date(events[indexEvent].date);
                tempDate.setHours(0, 0, 0, 0);
                if (tempDate.getTime() === currentDate.getTime()) {
                    hasEvent = true;
                    break;
                }
            }
            const day = (<DayButton today={highlight} current={index === currentDay} hasEvent={hasEvent} onClick={() => {
                    setDay(index);
                    if (openDetailsOnDateSelection && !detailsOpen) {
                        animatingDetail = 1;
                        setDetailsState(true);
                        // Force sidebar to close if onepanelatatime is true.
                        if (onePanelAtATime && sidebarOpen) {
                            animatingSidebar = -1;
                            setSidebarState(false);
                        }
                    }
                }}>
          <span>{index}</span>
        </DayButton>);
            days.push(day);
        }
        return (<Inner onClick={() => {
                if (floatingPanels) {
                    if (sidebarOpen) {
                        animatingSidebar = -1;
                        setSidebarState(false);
                    }
                    else if (detailsOpen) {
                        animatingDetail = -1;
                        setDetailsState(false);
                    }
                }
            }}>
        <h1>{languages[lang].months[currentMonth]}</h1>
        <div>
          <div>
            {languages[lang].daysShort.map((weekDay) => {
                return <div key={weekDay}>{weekDay.toUpperCase()}</div>;
            })}
          </div>
          <div>
            {days.map((day, i) => {
                return (<Day firstDay={i === 0} key={i} firstOfMonth={helperFunctions.getFirstWeekDayOfMonth(currentMonth, currentYear) + 1}>
                  {day}
                </Day>);
            })}
          </div>
        </div>
      </Inner>);
    }
    function CalendarDetails() {
        var selectedDate = new Date(currentYear, currentMonth, currentDay);
        // Will show delete event button on current showdelete index. -1 won't show anything
        const [showDelete, setDeleteState] = useState(-1);
        // Make sure no animation will run on next re-render.
        function animationEnd() {
            animatingDetail = 0;
        }
        function toggleDetails() {
            animatingDetail = detailsOpen ? -1 : 1;
            setDetailsState(!detailsOpen);
            // Force sidebar to close if onepanelatatime is true.
            if (animatingDetail === 1 && onePanelAtATime && sidebarOpen) {
                animatingSidebar = -1;
                setSidebarState(false);
            }
        }
        function toggleDeleteButton(i) {
            // Give parent component the current selected event.
            eventSelected(i);
            if (allowDeleteEvent) {
                showDelete === i ? setDeleteState(-1) : setDeleteState(i);
            }
        }
        const eventDivs = [];
        for (let index = 0; index < events.length; index++) {
            var eventDate = new Date(events[index].date);
            // Take out time from passed timestamp in order to compare only date
            var tempDate = new Date(events[index].date);
            tempDate.setHours(0, 0, 0, 0);
            if (helperFunctions.isValidDate(eventDate) && tempDate.getTime() === selectedDate.getTime()) {
                const event = (<Event key={index} onClick={() => toggleDeleteButton(index)} role="button">
            <p>{events[index].name}</p>
            <div>
              {events[index].allDay ? (<>
                  {showAllDayLabel && (<div aria-label={languages[lang].eventTime}>
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill={primaryColorRGB} d={CLOCK_ICON_SVG}/>
                      </svg>
                      <span>{languages[lang].allDay}</span>
                    </div>)}
                </>) : (<div>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill={primaryColorRGB} d={CLOCK_ICON_SVG}/>
                  </svg>
                  <span>{helperFunctions.getFormattedTime(eventDate, timeFormat24)}</span>
                </div>)}
              {events[index].extra && (<div>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill={primaryColorRGB} d={events[index].extra?.icon}/>
                  </svg>
                  <span>{events[index].extra?.text}</span>
                </div>)}
            </div>
            {showDelete === index && <button onClick={() => deleteEvent(index)}>{languages[lang].delete}</button>}
          </Event>);
                eventDivs.push(event);
            }
        }
        // For no-event days add no events text
        if (eventDivs.length === 0) {
            eventDivs.push(<p key={-1}>{languages[lang].noEventForThisDay}</p>);
        }
        return (<>
        <Details animatingIn={animatingDetail === 1} animatingOut={animatingDetail === -1} detailsOpen={detailsOpen} floatingPanels={floatingPanels} onAnimationEnd={animationEnd}>
          <div>
            {helperFunctions.getFormattedDate(selectedDate, detailDateFormat, lang, languages)}
            {allowAddEvent && (<button onClick={() => addEvent(new Date(currentYear, currentMonth, currentDay))}>
                {`${languages[lang].addEvent}, ${user} of organisation ${organisation}`}
              </button>)}
          </div>
          <div>
            {eventDivs.map((event) => {
                return event;
            })}
          </div>
        </Details>
        {showDetailToggler && (<CloseDetail onClick={toggleDetails} animatingIn={animatingDetail === 1} animatingOut={animatingDetail === -1} detailsOpen={detailsOpen} aria-label={languages[lang].toggleDetails}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill={secondaryColorRGB} d={DETAILS_ICON_SVG}/>
            </svg>
          </CloseDetail>)}
      </>);
    }
    /**************************
     * RENDER ACTUAL CALENDAR *
     **************************/
    return (<ThemeProvider theme={{
            primaryColor: primaryColorRGB,
            primaryColor50: helperFunctions.getRGBAColorWithAlpha(primaryColorRGB, 0.5),
            secondaryColor: secondaryColorRGB,
            todayColor: todayColorRGB,
            textColor: textColorRGB,
            indicatorColor: indicatorColorRGB,
            animationSpeed: `${animationSpeed}ms`,
            sidebarWidth: `${sidebarWidth}px`,
            detailWidth: `${detailWidth}px`,
        }}>
      <Calendar className={className} ref={calendarRef} style={style}>
        <CalendarSidebar />
        <CalendarInner />
        <CalendarDetails />
      </Calendar>
    </ThemeProvider>);
};
export default RevoCalendar;
