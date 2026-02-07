# AI Native Job Board

A modern job board application built with Next.js that allows recruiters to post jobs and candidates to apply with detailed applications. Features role switching, real-time application tracking, and a professional UI/UX.

## Features

### For Recruiters
- **Job Posting**: Create and manage job listings with detailed information
- **Application Dashboard**: Track all applications for posted jobs
- **Candidate Messages**: View detailed messages from candidates
- **Status Management**: Accept or reject applications with visual status tracking
- **Job Management**: View, edit, and delete posted jobs

### For Candidates
- **Job Browsing**: Browse available jobs with detailed descriptions
- **Application Form**: Apply with personalized messages
- **Application Tracking**: View past applications and their status
- **Professional UI**: Modern, responsive interface with dark mode support

### System Features
- **Role Switching**: Easy toggle between recruiter and candidate views
- **Session Storage**: Data persistence during development
- **Real-time Updates**: Instant status synchronization across all views
- **Toast Notifications**: Modern feedback system
- **Responsive Design**: Works seamlessly on all devices

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State Management**: React Hooks with Session Storage
- **TypeScript**: Full type safety
- **UI Components**: Custom components with modern design

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/shrideep-tamboli/ai-native-job-board.git
cd ai-native-job-board
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Testing the Full Workflow

1. **Start as Recruiter** (default role):
   - Post a job using the job creation form
   - Navigate to "View Posted Jobs" to see your listings

2. **Switch to Candidate**:
   - Use the role dropdown in the header to switch to "Candidate"
   - Browse available jobs and click "Apply for this Job"
   - Fill in the application message and submit

3. **Track Applications**:
   - As Candidate: View your past applications and their status
   - As Recruiter: Click on job titles or "View Applications" to see candidate messages
   - Accept or reject applications to update their status

## Project Structure

```
src/app/
├── page.tsx                    # Main page with role switching
├── recruiter/
│   ├── page.tsx               # Recruiter entry point
│   ├── create-job/page.tsx    # Job creation form
│   └── job-posts/
│       ├── page.tsx           # Job listings
│       └── dashboard/page.tsx # Application tracking dashboard
└── candidate/
    ├── page.tsx               # Candidate entry point
    ├── feed/page.tsx          # Job browsing and application
    └── past-applications/page.tsx # Application history
```

## Data Storage

Currently uses browser session storage for development purposes:
- **Jobs**: Stored in `postedJobs` key
- **Applications**: Stored in `jobApplications` key
- **User Role**: Stored in `userRole` key

*Note: Data persists during the browser session but clears when the session ends.*

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- User authentication and profiles
- File upload for resumes
- Email notifications
- Advanced search and filtering
- Company profiles
- Application analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Deploy on Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
