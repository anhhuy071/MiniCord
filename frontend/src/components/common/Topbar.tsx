type TopbarProps = {
  activeServer?: string;

};

export default function Topbar({ activeServer }: TopbarProps) {
  return (
    <header className="app-topbar" role="banner">
     
      <div className="topbar-center">
        <div className="topbar-title" aria-label="Current context">
          {activeServer ? <span className="topbar-context">{activeServer}</span> : null}
        </div>
      </div>
      <div className="topbar-right">
        <button className="icon-button" aria-label="Notifications">
          <i className="fa-solid fa-bell" aria-hidden="true" />
        </button>
        <button className="icon-button" aria-label="Help">
          <i className="fa-regular fa-circle-question" aria-hidden="true" />
        </button>
        <button className="topbar-profile" aria-label="Account">
          <span className="topbar-avatar">AC</span>
        </button>
      </div>
    </header>
  );
}
