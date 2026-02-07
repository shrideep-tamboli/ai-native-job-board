'use client';

import { useState, useEffect } from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  salary: string;
  postedAt: string;
}

import CandidateFeedPage from "./feed/page";

export default function CandidatePage() {
  return <CandidateFeedPage />;
}