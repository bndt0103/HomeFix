import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Maximize2, X } from 'lucide-react';
import { CustomerSupportChat } from './support-chat';
import './customer-chat-widget.css';

export function CustomerChatWidget() {
  const [open, setOpen] = useState(false),
    [viewport, setViewport] = useState({}),
    launcher = useRef(null),
    closeButton = useRef(null);
  function close() {
    setOpen(false);
    launcher.current?.focus();
  }
  useEffect(() => {
    function resize() {
      const view = window.visualViewport;
      setViewport({
        '--chat-view-height': (view?.height || innerHeight) + 'px',
        '--chat-keyboard-inset':
          Math.max(0, innerHeight - (view?.height || innerHeight) - (view?.offsetTop || 0)) + 'px',
      });
    }
    resize();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('scroll', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('scroll', resize);
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    function escape(event) {
      if (event.key === 'Escape' && !document.querySelector('[aria-modal="true"]')) close();
    }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);
  return (
    <div className="customer-chat-widget" style={viewport}>
      {open && (
        <section
          id="customer-quick-chat"
          className="customer-chat-panel"
          role="dialog"
          aria-label="Chat hỗ trợ nhanh"
        >
          <header>
            <div>
              <b>HomeFix · Chat hỗ trợ</b>
              <small>Hỏi AI hoặc gặp nhân viên</small>
            </div>
            <div className="actions">
              <Link
                className="icon-btn"
                to="/support/chat"
                aria-label="Mở trang chat hỗ trợ"
                onClick={close}
              >
                <Maximize2 size={18} />
              </Link>
              <button
                ref={closeButton}
                className="icon-btn"
                type="button"
                aria-label="Đóng chat hỗ trợ"
                onClick={close}
              >
                <X size={20} />
              </button>
            </div>
          </header>
          <div className="customer-chat-body">
            <CustomerSupportChat compact />
          </div>
        </section>
      )}
      <button
        ref={launcher}
        type="button"
        className="customer-chat-launcher"
        aria-label={open ? 'Thu gọn chat AI' : 'Mở chat AI'}
        aria-expanded={open}
        aria-controls="customer-quick-chat"
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        <span>Chat AI</span>
      </button>
    </div>
  );
}
