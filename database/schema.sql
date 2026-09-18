CREATE TABLE families (
    id                  SERIAL PRIMARY KEY,
    name                TEXT NOT NULL,
    quotient_familial   NUMERIC(10,2) NOT NULL CHECK (quotient_familial >= 0),
    created_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE members (
    id                          SERIAL PRIMARY KEY,
    family_id                   INTEGER REFERENCES families(id) ON DELETE SET NULL,
    first_name                  TEXT NOT NULL,
    last_name                   TEXT NOT NULL,
    birth_date                  DATE NOT NULL,
    is_resident                 BOOLEAN NOT NULL DEFAULT false,
    medical_certificate_date    DATE,
    pass_sport_code             TEXT,
    medical_status              TEXT NOT NULL DEFAULT 'compliant'
                                   CHECK (medical_status IN ('compliant', 'medical_non_compliant')),
    created_at                  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_members_family ON members(family_id);

CREATE TABLE associations (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    contact_email   TEXT,
    contact_phone   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE facilities (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    address         TEXT,
    erp_capacity    INTEGER NOT NULL CHECK (erp_capacity > 0),
    is_divisible    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE activities (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    association_id  INTEGER NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    facility_id     INTEGER NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    sub_zone        TEXT,
    sport_type      TEXT NOT NULL,
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL CHECK (end_time > start_time),
    base_price      NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
    max_capacity    INTEGER NOT NULL CHECK (max_capacity > 0),
    age_category    TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_activities_facility_day ON activities(facility_id, day_of_week);

CREATE TABLE registrations (
    id              SERIAL PRIMARY KEY,
    member_id       INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    activity_id     INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    final_price     NUMERIC(10,2) NOT NULL CHECK (final_price >= 15.00),
    payment_plan    TEXT NOT NULL DEFAULT 'full'
                       CHECK (payment_plan IN ('full', 'installments_3')),
    status          TEXT NOT NULL DEFAULT 'confirmed'
                       CHECK (status IN ('confirmed', 'cancelled')),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (member_id, activity_id)
);
CREATE INDEX idx_registrations_activity_status ON registrations(activity_id, status);

CREATE TABLE waiting_list (
    id                      SERIAL PRIMARY KEY,
    activity_id             INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    member_id               INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    priority_score          INTEGER NOT NULL DEFAULT 0,
    status                  TEXT NOT NULL DEFAULT 'waiting'
                               CHECK (status IN ('waiting', 'promoted_pending', 'confirmed', 'expired')),
    deadline_confirmation   TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_waitinglist_activity_priority
    ON waiting_list(activity_id, status, priority_score DESC, created_at ASC);