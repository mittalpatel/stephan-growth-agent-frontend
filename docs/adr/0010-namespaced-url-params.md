# ADR-0010: Namespaced URL query keys

**Status:** Accepted

## Decision

List state lives in the URL, and every key is prefixed with the list's namespace:
`widgets_page`, `widgets_sort`, `widgets_search_by`. `useQueryParams(namespace)` owns
the reading and writing.

## Why the URL rather than component state

A filtered list should be linkable, survive a refresh, and restore correctly on
back-navigation. None of that is true of `useState`, and all of it is what users expect
from a table with filters — sending someone "the view I'm looking at" is the whole point.

## Why namespaced

Two lists on one screen with bare `page` keys fight over the same parameter. Paging one
pages the other.

The alternative — reaching for a namespace only once a second list appears — means the
first list's URLs change shape when it does, breaking every bookmark and shared link.
Namespacing from the start costs a prefix and removes the migration entirely.

## Costs

- URLs are longer and less pretty.
- Every list hook must pass its namespace consistently; a typo silently creates a second
  independent parameter.

## Deliberate exception

Personal display preferences — table versus grid — stay in component state. They are not
part of what the link points at, and putting them in the URL imposes your layout on
whoever receives it.
