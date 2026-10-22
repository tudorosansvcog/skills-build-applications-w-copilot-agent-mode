import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

type Props<T> = {
  title: string;
  description: string;
  endpoint: string;
  emptyMessage: string;
  isEmpty: (data: T) => boolean;
  children: (data: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, endpoint, emptyMessage, isEmpty, children }: Props<T>) {
  const [resource, setResource] = useState<ResourceState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setResource({ status: 'loading' });
    getJson<T>(endpoint)
      .then((data) => {
        if (active) setResource({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (active) setResource({ status: 'error', message: error instanceof Error ? error.message : 'Unexpected error' });
      });
    return () => { active = false; };
  }, [endpoint]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {resource.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {resource.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}: {resource.message}</p>}
        {resource.status === 'success' && isEmpty(resource.data) && <p role="status">{emptyMessage}</p>}
        {resource.status === 'success' && !isEmpty(resource.data) && children(resource.data)}
      </div>
    </section>
  );
}
