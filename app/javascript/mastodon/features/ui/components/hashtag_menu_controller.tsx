import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

import { useIntl, defineMessages } from 'react-intl';

import { useLocation } from 'react-router-dom';

import Overlay from 'react-overlays/Overlay';
import type {
  OffsetValue,
  UsePopperOptions,
} from 'react-overlays/esm/usePopper';

import { DropdownMenu } from 'mastodon/components/dropdown_menu';
import { useAppSelector } from 'mastodon/store';

const messages = defineMessages({
  browseHashtag: { id: '', defaultMessage: 'Browse posts in #{hashtag}' },
  browseHashtagFromAccount: {
    id: '',
    defaultMessage: 'Browse posts from @{name} in #{hashtag}',
  },
  muteHashtag: { id: '', defaultMessage: 'Mute #{hashtag}' },
});

const offset = [5, 5] as OffsetValue;
const popperConfig = { strategy: 'fixed' } as UsePopperOptions;

const isHashtagLink = (
  element: HTMLAnchorElement | null,
): element is HTMLAnchorElement => {
  if (!element) {
    return false;
  }

  return element.matches('[data-menu-hashtag]');
};

interface Params {
  hashtag?: string;
  accountId?: string;
}

export const HashtagMenuController: React.FC = () => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [params, setParams] = useState<Params>({});
  const targetRef = useRef<HTMLAnchorElement | null>(null);
  const location = useLocation();
  const account = useAppSelector((state) =>
    params.accountId ? state.accounts.get(params.accountId) : undefined,
  );

  useEffect(() => {
    setOpen(false);
    targetRef.current = null;
  }, [setOpen, location]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');

      if (e.button !== 0 || e.ctrlKey || e.metaKey) {
        return;
      }

      if (isHashtagLink(target)) {
        const hashtag = target.text.replace(/^#/, '');
        const accountId = target.getAttribute('data-menu-hashtag');

        if (!hashtag || !accountId) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        targetRef.current = target;
        setOpen(true);
        setParams({ hashtag, accountId });
      }
    };

    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [setParams, setOpen]);

  const handleClose = useCallback(() => {
    setOpen(false);
    targetRef.current = null;
  }, [setOpen]);

  const handleItemClick = useCallback(() => {
    // todo
  }, []);

  const menu = useMemo(
    () => [
      {
        text: intl.formatMessage(messages.browseHashtag, {
          hashtag: params.hashtag,
        }),
        to: `/tags/${params.hashtag}`,
      },
      {
        text: intl.formatMessage(messages.browseHashtagFromAccount, {
          hashtag: params.hashtag,
          name: account?.username,
        }),
        to: `/@${account?.acct}/tagged/${params.hashtag}`,
      },
      null,
      {
        text: intl.formatMessage(messages.muteHashtag, {
          hashtag: params.hashtag,
        }),
        href: '/filters',
        dangerous: true,
      },
    ],
    [intl, params, account],
  );

  if (!open) {
    return null;
  }

  return (
    <Overlay
      show={open}
      offset={offset}
      placement='bottom'
      flip
      target={targetRef}
      popperConfig={popperConfig}
    >
      {({ props, arrowProps, placement }) => (
        <div {...props}>
          <div className={`dropdown-animation dropdown-menu ${placement}`}>
            <div
              className={`dropdown-menu__arrow ${placement}`}
              {...arrowProps}
            />

            <DropdownMenu
              items={menu}
              onClose={handleClose}
              onItemClick={handleItemClick}
              openedViaKeyboard={false}
            />
          </div>
        </div>
      )}
    </Overlay>
  );
};
