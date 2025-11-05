<script lang="ts">
    import { onMount } from 'svelte';
    import { tasksStore, tasksByDate } from '../stores/tasksStore';
    import { eventsStore, eventsByDate } from '../stores/eventsStore';
    import TaskCard from './TaskCard.svelte';
    import EventCard from './EventCard.svelte';

    export let selectedDate: Date = new Date();

    let days: Date[] = [];
    let currentMonth = selectedDate.getMonth();
    let currentYear = selectedDate.getFullYear();

    $: calendarDays = generateCalendarDays(currentYear, currentMonth);

    function generateCalendarDays(year: number, month: number) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

        // Previous month days
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const prevLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();

        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: new Date(prevYear, prevMonth, prevLastDay - i),
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Next month days to fill the grid
        const remaining = 42 - days.length;
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;

        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: new Date(nextYear, nextMonth, i),
                isCurrentMonth: false
            });
        }

        return days;
    }

    function formatDateKey(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    function isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    function prevMonth() {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
    }

    function nextMonth() {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
    }

    function goToToday() {
        const today = new Date();
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
        selectedDate = today;
    }

    $: monthName = new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });
</script>

<div class="calendar-view">
    <div class="calendar-header">
        <button class="nav-button" on:click={prevMonth}>‹</button>
        <h2 class="month-title">{monthName}</h2>
        <button class="nav-button" on:click={nextMonth}>›</button>
        <button class="today-button" on:click={goToToday}>Today</button>
    </div>

    <div class="calendar-grid">
        <div class="calendar-weekdays">
            {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
                <div class="weekday">{day}</div>
            {/each}
        </div>

        <div class="calendar-days">
            {#each calendarDays as { date, isCurrentMonth }}
                {@const dateKey = formatDateKey(date)}
                {@const tasksForDay = $tasksByDate.get(dateKey) || []}
                {@const eventsForDay = $eventsByDate.get(dateKey) || []}
                {@const hasItems = tasksForDay.length > 0 || eventsForDay.length > 0}

                <div
                    class="calendar-day"
                    class:current-month={isCurrentMonth}
                    class:today={isToday(date)}
                    class:selected={selectedDate.toDateString() === date.toDateString()}
                    class:has-items={hasItems}
                    on:click={() => selectedDate = date}
                >
                    <div class="day-number">{date.getDate()}</div>
                    {#if hasItems}
                        <div class="day-indicators">
                            {#if tasksForDay.length > 0}
                                <span class="indicator indicator-tasks">{tasksForDay.length}</span>
                            {/if}
                            {#if eventsForDay.length > 0}
                                <span class="indicator indicator-events">{eventsForDay.length}</span>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>

    <div class="selected-day-details">
        <h3 class="details-title">Selected Day: {selectedDate.toLocaleDateString()}</h3>
        <div class="day-items">
            {#each $tasksByDate.get(formatDateKey(selectedDate)) || [] as task}
                <TaskCard {task} />
            {/each}
            {#each $eventsByDate.get(formatDateKey(selectedDate)) || [] as event}
                <EventCard {event} />
            {/each}
        </div>
    </div>
</div>

<style>
    .calendar-view {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .calendar-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--outline);
    }

    .nav-button {
        width: 40px;
        height: 40px;
        border: 1px solid var(--outline);
        border-radius: var(--radius-md);
        background: var(--surface);
        cursor: pointer;
        font-size: 1.5rem;
        color: var(--on-surface);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .nav-button:hover {
        background: var(--surface-variant);
    }

    .month-title {
        flex: 1;
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .today-button {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--outline);
        border-radius: var(--radius-md);
        background: var(--primary);
        color: var(--on-primary);
        cursor: pointer;
        font-weight: 500;
    }

    .calendar-grid {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .calendar-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        border-bottom: 1px solid var(--outline);
        background: var(--surface-variant);
    }

    .weekday {
        padding: var(--spacing-sm);
        text-align: center;
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--on-surface-variant);
    }

    .calendar-days {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-auto-rows: minmax(100px, 1fr);
        overflow-y: auto;
    }

    .calendar-day {
        border: 1px solid var(--outline-variant);
        padding: var(--spacing-xs);
        cursor: pointer;
        transition: background-color 0.2s;
        display: flex;
        flex-direction: column;
        min-height: 100px;
    }

    .calendar-day:hover {
        background: var(--surface-variant);
    }

    .calendar-day.current-month {
        background: var(--surface);
    }

    .calendar-day:not(.current-month) {
        background: var(--surface-variant);
        opacity: 0.5;
    }

    .calendar-day.today {
        background: var(--primary-container);
        border-color: var(--primary);
    }

    .calendar-day.selected {
        background: var(--primary);
        color: var(--on-primary);
    }

    .day-number {
        font-weight: 600;
        font-size: 0.875rem;
    }

    .day-indicators {
        display: flex;
        gap: var(--spacing-xs);
        margin-top: auto;
        flex-wrap: wrap;
    }

    .indicator {
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
    }

    .indicator-tasks {
        background: var(--primary);
        color: var(--on-primary);
    }

    .indicator-events {
        background: var(--secondary);
        color: var(--on-secondary);
    }

    .selected-day-details {
        border-top: 1px solid var(--outline);
        padding: var(--spacing-lg);
        max-height: 400px;
        overflow-y: auto;
    }

    .details-title {
        margin: 0 0 var(--spacing-md) 0;
        font-size: 1.125rem;
        font-weight: 600;
    }

    .day-items {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }
</style>
