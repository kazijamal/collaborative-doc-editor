import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Field, Form } from 'formik';
import axios from 'axios';

type PropType = {
    url_prefix: string;
};

const Register = ({ url_prefix }: PropType) => {
    const [error, setError] = useState('');
    let navigate = useNavigate();

    return (
        <div style={{ fontSize: 'x-large' }}>
            <h1>Register</h1>
            {error}
            <Formik
                initialValues={{ name: '', email: '', password: '' }}
                onSubmit={async (values) => {
                    const { name, email, password } = values;
                    const res = await axios.post(
                        `${url_prefix}/users/signup`,
                        {
                            name,
                            email,
                            password,
                        },
                        { withCredentials: true }
                    );
                    if (res.data.error) {
                        setError('Register failed');
                    } else {
                        navigate('/login');
                    }
                }}
            >
                <Form>
                    Name: <Field name='name' type='text' />
                    <br></br>
                    Email: <Field name='email' type='email' />
                    <br></br>
                    Password: <Field name='password' type='password' />
                    <br></br>
                    <button type='submit'>Submit</button>
                </Form>
            </Formik>

            <Link to='/'>Landing</Link>
            <br></br>
        </div>
    );
};

export default Register;
