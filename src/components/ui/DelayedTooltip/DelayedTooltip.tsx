"use client";
import React, { useEffect, useRef, useState } from "react";
import "../Tooltip/Tooltip.css";

type DelayedTooltipProps = {
	content: string;
	delay?: number; // milliseconds
	children: React.ReactNode;
	className?: string;
};

// Delayed tooltip that appears after hovering for a given time (default 7s)
export function DelayedTooltip({
	content,
	delay = 7000,
	children,
	className = "",
}: DelayedTooltipProps) {
	const [isVisible, setIsVisible] = useState(false);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const timerRef = useRef<number | null>(null);

	const handleMouseEnter = (e: React.MouseEvent) => {
		if (!content.trim()) return;
		const rect = e.currentTarget.getBoundingClientRect();
		setPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
		// Start delay timer
		timerRef.current = window.setTimeout(() => {
			setIsVisible(true);
		}, Math.max(0, delay));
	};

	const clearTimer = () => {
		if (timerRef.current) {
			window.clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	};

	const handleMouseLeave = () => {
		clearTimer();
		setIsVisible(false);
	};

	// Clear timer on unmount to avoid leaks
	useEffect(() => () => clearTimer(), []);

	return (
		<>
			<div
				className={`tooltip-trigger ${className}`}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onMouseDown={handleMouseLeave}
			>
				{children}
			</div>

			{isVisible && content.trim() && (
				<div
					className="tooltip-popup"
					style={{
						position: "fixed",
						left: `${position.x}px`,
						top: `${position.y}px`,
						transform: "translateX(-50%) translateY(-100%)",
						zIndex: 10000,
						pointerEvents: "none",
					}}
				>
					<div className="tooltip-content">{content}</div>
					<div className="tooltip-arrow"></div>
				</div>
			)}
		</>
	);
}
