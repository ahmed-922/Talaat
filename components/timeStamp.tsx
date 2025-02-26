import React, { useEffect, useState } from "react";
import {Text, StyleSheet, Share as RNShare, } from "react-native";

export default function Timestamp() {
// --- Helper Functions for Timestamp Formatting ---

const timeAgo: React.FC = (date: Date) => {
    const now = new Date();
    const secondsElapsed = Math.floor((now.getTime() - date.getTime()) / 1000);
  
    if (secondsElapsed < 60) {
      return "Just now";
    }
  
    const minutes = Math.floor(secondsElapsed / 60);
    if (minutes < 60) {
      return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    }
  
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }
  
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return days === 1 ? "1 day ago" : `${days} days ago`;
    }
  
    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    }
  
    const months = Math.floor(days / 30);
    if (months < 12) {
      return months === 1 ? "1 month ago" : `${months} months ago`;
    }
  
    const years = Math.floor(months / 12);
    return years === 1 ? "1 year ago" : `${years} years ago`;
  }

  function formatTime(date: Date) {
    // 24-hour format with seconds
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  
  // --- Component to Display the Post Timestamp ---
  
  function PostTimestamp({ createdAt }: { createdAt: any }) {
    if (!createdAt || typeof createdAt.toDate !== "function") return null;
    const date = createdAt.toDate();
    return (
      <Text style={styles.timestamp}>
        {timeAgo(date)} at {formatTime(date)}
      </Text>
    );
  }

}

const styles = StyleSheet.create({
    timestamp: {
        marginBottom: 4,
        color: "#666",
        fontSize: 12,
      },
    
    });

