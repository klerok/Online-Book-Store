import styles from "../styles/index.module.css";

function messageRowClass(msg, stylesObj) {
  if (msg.kind === "system") return stylesObj.rowSystem;
  if (msg.kind === "user") return stylesObj.rowUser;
  return stylesObj.rowSupport;
}

function bubbleClass(msg, stylesObj) {
  if (msg.kind === "system") return stylesObj.bubbleSystem;
  if (msg.kind === "user") return stylesObj.bubbleUser;
  return stylesObj.bubbleSupport;
}

export function SupportChatPanel({ desk }) {
  const {
    selectedChatId,
    selectedChat,
    socketConnected,
    isAgent,
    chatIsOpen,
    closeSubmitting,
    handleCloseTicket,
    messagesContainerRef,
    messages,
    messagesLoading,
    ticketDescriptionText,
    draft,
    setDraft,
    handleSend,
    composerDisabled,
  } = desk;

  const title = selectedChatId
    ? selectedChat?.title ?? `Чат №${selectedChatId}`
    : "Чат поддержки";

  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatToolbar}>
        <div className={styles.chatToolbarInfo}>
          <span className={styles.chatAvatar} aria-hidden>
            BP
          </span>
          <div>
            <p className={styles.chatName}>{title}</p>
            <p className={styles.chatStatus}>
              {socketConnected
                ? "Связь с сервером установлена"
                : "Устанавливаем связь…"}
            </p>
          </div>
        </div>
        <div className={styles.chatToolbarActions}>
          {isAgent && selectedChatId && chatIsOpen && (
            <button
              type="button"
              className={styles.closeTicketBtn}
              disabled={closeSubmitting}
              onClick={handleCloseTicket}
            >
              {closeSubmitting ? "Закрытие…" : "Закрыть обращение"}
            </button>
          )}
          <span
            className={
              socketConnected ? styles.badgeLive : styles.badgeOffline
            }
          >
            {socketConnected ? "Связь есть" : "Нет связи"}
          </span>
        </div>
      </div>

      {!selectedChatId ? (
        <div className={styles.emptyChat}>
          <p className={styles.emptyChatTitle}>Выберите обращение слева</p>
          <p className={styles.emptyChatText}>
            {isAgent
              ? "После выбора откроется история переписки с клиентом. Новые сообщения приходят в реальном времени."
              : "Здесь отображается переписка между вами и агентом поддержки."}
          </p>
        </div>
      ) : (
        <>
          {isAgent && ticketDescriptionText ? (
            <div
              className={styles.ticketDescriptionPanel}
              aria-label="Описание обращения"
            >
              <p className={styles.ticketDescriptionLabel}>
                Описание от покупателя
              </p>
              <p className={styles.ticketDescriptionText}>
                {ticketDescriptionText}
              </p>
            </div>
          ) : null}

          <div
            ref={messagesContainerRef}
            className={styles.messages}
            role="log"
            aria-live="polite"
          >
            {messagesLoading && (
              <p className={styles.messagesLoading}>Загрузка сообщений…</p>
            )}
            {!messagesLoading &&
              messages.map((msg) => (
                <div key={msg.id} className={messageRowClass(msg, styles)}>
                  <div className={bubbleClass(msg, styles)}>
                    <p className={styles.bubbleText}>{msg.text}</p>
                    <span className={styles.bubbleTime}>{msg.timeLabel}</span>
                  </div>
                </div>
              ))}
          </div>

          <form className={styles.composer} onSubmit={handleSend}>
            <label
              htmlFor="support-message"
              className={styles.visuallyHidden}
            >
              Сообщение
            </label>
            <textarea
              id="support-message"
              className={styles.textarea}
              placeholder="Введите сообщение…"
              rows={2}
              value={draft}
              disabled={composerDisabled}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={composerDisabled || !draft.trim()}
            >
              Отправить
            </button>
          </form>
        </>
      )}
    </div>
  );
}
