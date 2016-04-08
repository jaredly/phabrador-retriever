
export const statusText = {
  mine: {
    accepted: "Ready to land!",
    rejected: "Changed requested",
    waiting: "Waiting for review...",
  },
  others: {
    accepted: "You've accepted it",
    rejected: "You've requested changes",
    waiting: "Ready for your review!",
    'other-rejected': "Changes requested by another",
  },
}

export const sortOrder = ['waiting', 'other-rejected', 'rejected', 'accepted'];
